import { World } from "./World";
import { Unit } from "./Unit/Unit";
import { Event } from "./Util/Event";
import { Vector } from "./Geometry/Vector";
import { ResourceManager } from "./Util/ResourceManager";
import { Resource } from "./Util/RoboPack";
import { Master } from "./Master";

export interface ITextureInfo
{
    Width: number;
    Height: number;
    Object: WebGLTexture;
}

export interface IRendererArgs
{
    master: Master;
    world: World;
    canvas: HTMLCanvasElement;

    dotPerPoint?: number;
    debugMode?: boolean;
    disableShadows?: boolean;
    viewport?: Vector;
    center?: Vector;
    noTick?: boolean;
    selectedZ?: number;
}

/**
 * The WebGL parts are based on the examples of Gregg Tavares.
 */
// TODO: Implement debug grid drawing
// TODO: Implement shadows
export class Renderer
{
    public static VertexShader = 
    `
        attribute vec4 a_position;
        attribute vec2 a_textureCoord;

        uniform mat4 u_matrix;
        uniform mat4 u_textureMatrix;

        varying vec2 v_textureCoord;

        void main() 
        {
            gl_Position = u_matrix * a_position;
            v_textureCoord = (u_textureMatrix * vec4(a_textureCoord, 0, 1)).xy;
        }
    `;

    public static FragmentShader =
    `
        precision mediump float;

        varying vec2 v_textureCoord;

        uniform sampler2D texture;

        void main()
        {
            gl_FragColor = texture2D(texture, v_textureCoord);
        }
    `;

    public static MinFps = 1 / 25;
    public static DebugColor = new Uint8Array([0, 0, 0, 255]);

    private readonly master: Master;
    private readonly world: World;
    private readonly canvas: HTMLCanvasElement;
    private readonly gl: WebGLRenderingContext;
    private readonly dotPerPoint: number;

    private readonly matrixStack: Mat4Stack;
    private readonly program: WebGLProgram;
    private readonly positionLocation: number;
    private readonly textureCoordLocation: number;
    private readonly matrixLocation: WebGLUniformLocation;
    private readonly textureMatrixLocation: WebGLUniformLocation;
    private readonly textureLocation: WebGLUniformLocation;
    private readonly positionBuffer: WebGLBuffer;
    private readonly textureCoordBuffer: WebGLBuffer;

    private readonly debugMode: boolean;
    private readonly disableShadows: boolean;

    private textures: { [id: string]: any } = {};
    private stop: boolean = false;
    private lastTick: number;
    private center: Vector;
    private viewport: Vector;
    private noTick: boolean;
    private selectedZ: number;
    private selectedUnit: Unit;

    /**
     * Called upon redraw.
     */
    public OnDraw: Event<number> = new Event();

    /**
     * Construct a new game object.
     */
    public constructor(args: IRendererArgs)
    {
        this.master = args.master;
        this.world = args.world;
        this.canvas = args.canvas;

        this.dotPerPoint = args.dotPerPoint || 25;
        this.debugMode = args.debugMode || false;
        this.disableShadows = args.disableShadows || false;
        this.viewport = args.viewport || new Vector(6, 6);
        this.center = args.center || new Vector(0, 0);
        this.noTick = args.noTick || false;
        this.selectedZ = args.selectedZ || undefined;
        
        this.gl = this.canvas.getContext("webgl");
        this.matrixStack = new Mat4Stack();
        
        // Setup GLSL program
        this.program = this.gl.createProgram();
        
        const vertexShader = this.gl.createShader(this.gl.VERTEX_SHADER);

        this.gl.shaderSource(vertexShader, Renderer.VertexShader);
        this.gl.compileShader(vertexShader);
        this.gl.attachShader(this.program, vertexShader);
        
        const fragmentShader = this.gl.createShader(this.gl.FRAGMENT_SHADER);

        this.gl.shaderSource(fragmentShader, Renderer.FragmentShader);
        this.gl.compileShader(fragmentShader);
        this.gl.attachShader(this.program, fragmentShader);
        
        this.gl.linkProgram(this.program);
        
        if(!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS))
        {
            throw new Error("Could not compile WebGL program");
        }

        // Look up where the vertex data needs to go.
        this.positionLocation = this.gl.getAttribLocation(this.program, "a_position");
        this.textureCoordLocation = this.gl.getAttribLocation(this.program, "a_textureCoord");
        
        // Lookup uniforms
        this.matrixLocation = this.gl.getUniformLocation(this.program, "u_matrix");
        this.textureMatrixLocation = this.gl.getUniformLocation(this.program, "u_textureMatrix");
        this.textureLocation = this.gl.getUniformLocation(this.program, "u_texture");
        
        // Create a buffer.
        this.positionBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        
        // Put a unit quad in the buffer
        const positions = [
            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1,
        ];

        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(positions), this.gl.STATIC_DRAW);
        
        // Create a buffer for texture coords
        this.textureCoordBuffer = this.gl.createBuffer();
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
        
        // Put textureCoords in the buffer
        const textureCoords = [
            0, 0,
            0, 1,
            1, 0,
            1, 0,
            0, 1,
            1, 1,
        ];
        
        this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array(textureCoords), this.gl.STATIC_DRAW);
    }

    private DrawImage(texture: ITextureInfo, 
        sx: number, sy: number, sw: number, sh: number, 
        dx: number, dy: number, dw: number, dh: number)
    {
        this.gl.bindTexture(this.gl.TEXTURE_2D, texture.Object);
    
        // Tell WebGL to use our shader program pair
        this.gl.useProgram(this.program);
    
        // Setup the attributes to pull data from our buffers
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.positionBuffer);
        this.gl.enableVertexAttribArray(this.positionLocation);
        this.gl.vertexAttribPointer(this.positionLocation, 2, this.gl.FLOAT, false, 0, 0);
        this.gl.bindBuffer(this.gl.ARRAY_BUFFER, this.textureCoordBuffer);
        this.gl.enableVertexAttribArray(this.textureCoordLocation);
        this.gl.vertexAttribPointer(this.textureCoordLocation, 2, this.gl.FLOAT, false, 0, 0);
    
        // This matirx will convert from pixels to clip space
        let matrix = Mat4.Orthographic(0, this.gl.canvas.width, this.gl.canvas.height, 0, -1, 1);
    
        // This matrix moves the origin to the one represented by
        // the current matrix stack.
        matrix = Mat4.Multiply(matrix, this.matrixStack.GetHead());
    
        // This matrix will translate our quad to dx, dy
        matrix = Mat4.Translate(matrix, dx, dy, 0);
    
        // This matrix will scale our 1 unit quad
        // from 1 unit to texture.Width, texture.Height units
        matrix = Mat4.Scale(matrix, dw, dh, 1);
    
        // Set the matrix.
        this.gl.uniformMatrix4fv(this.matrixLocation, false, matrix);
    
        // Because texture coordinates go from 0 to 1
        // and because our texture coordinates are already a unit quad
        // we can select an area of the texture by scaling the unit quad down
        let textureMatrix = Mat4.Translation(sx / texture.Width, sy / texture.Height, 0);

        textureMatrix = Mat4.Scale(textureMatrix, sw / texture.Width, sh / texture.Height, 1);
    
        // Set the texture matrix.
        this.gl.uniformMatrix4fv(this.textureMatrixLocation, false, textureMatrix);
    
        // Tell the shader to get the texture from texture unit 0
        this.gl.uniform1i(this.textureLocation, 0);
    
        // Draw the quad (2 triangles, 6 vertices)
        this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
    }

    private LoadTexture(url: string) 
    {
        const texture = this.gl.createTexture();

        this.gl.bindTexture(this.gl.TEXTURE_2D, texture);

        // Fill the texture with a 1x1 debug pixel.
        this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, 1, 1, 0, 
            this.gl.RGBA, this.gl.UNSIGNED_BYTE, Renderer.DebugColor);
    
        // Assume all images are not a power of 2
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_S, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_WRAP_T, this.gl.CLAMP_TO_EDGE);
        this.gl.texParameteri(this.gl.TEXTURE_2D, this.gl.TEXTURE_MIN_FILTER, this.gl.LINEAR);
    
        const info: ITextureInfo = {
            Width: 1,
            Height: 1,
            Object: texture
        };
        
        const image = new Image();

        image.addEventListener("load", () => 
        {
            info.Width = image.width;
            info.Height = image.height;
    
            this.gl.bindTexture(this.gl.TEXTURE_2D, info.Object);
            this.gl.texImage2D(this.gl.TEXTURE_2D, 0, this.gl.RGBA, this.gl.RGBA, this.gl.UNSIGNED_BYTE, image);
        });

        image.src = url;
    
        return info;
    }

    public async LoadTextures(): Promise<void>
    {
        const textures = ResourceManager.GetList().filter(r => 
            Resource.GetMeta(r.Buffer).Mime === "image/png");
        
        for(let resource of textures)
        {
            const uri = resource.Uri;

            this.textures[uri] = this.LoadTexture(resource.GetUrl());
        }
    }

    /**
     * Find a Vector under a pixel point.
     */
    public FindVectorByPixel(x: number, y: number): Vector
    {
        const view = this.viewport.Scale(this.dotPerPoint);

        let dx = this.dotPerPoint;
        let dy = this.dotPerPoint;
        
        dx *= this.canvas.clientWidth / view.X;
        dy *= this.canvas.clientHeight / view.Y;

        return new Vector(x / dx, y / dy);
    }

    /**
     * Draw the given unit onto the canvas.
     * @param unit
     */
    private DrawUnit(unit: Unit)
    {
        if(!unit || !unit.GetBody())
        {
            return;
        }
        
        const body = unit.GetBody();
        const position = body.GetPosition();
        const scale = body.GetScale();
        const rotation = body.GetRotation();
        const texture = this.textures[unit.GetTexture()];
        
        const s = scale.Scale(this.dotPerPoint);
        const c = (position.Sub(this.center).Add(this.viewport.Scale(0.5))).Scale(this.dotPerPoint);
        const p = c.Sub(s.Scale(0.5));

        this.matrixStack.Push();
        this.matrixStack.Translate(p.X + s.X / 2, p.Y + s.Y / 2);
        this.matrixStack.RotateZ(rotation);
        this.matrixStack.Translate(-s.X / 2, -s.Y / 2);

        this.DrawImage(texture,
            0, 0, texture.Width, texture.Height,
            0, 0, s.X, s.Y);

        this.matrixStack.Pop();
    }
    
    /**
     * Update the canvas.
     */
    private async Render()
    {
        const view = this.viewport.Scale(this.dotPerPoint);

        this.canvas.width = view.X;
        this.canvas.height = view.Y;

        // Draw units in the order of their Z index
        const levels: Unit[][] = [];

        const process = (unit: Unit) =>
        {
            const z = unit.GetBody().GetZ();
            
            if(typeof this.selectedZ == "number" && this.selectedZ != z)
            {
                return;
            }
                
            if(!levels.hasOwnProperty(z))
            {
                levels[z] = [];
            }

            levels[z].push(unit);
        }

        this.world
            .GetCells()
            .GetArray()
            .forEach(process);

        this.world
            .GetActors()
            .GetArray()
            .forEach(process);

        // Tell WebGL how to convert from clip space to pixels
        this.gl.viewport(0, 0, this.gl.canvas.width, this.gl.canvas.height);
        this.gl.clear(this.gl.COLOR_BUFFER_BIT);

        for(let level of levels)
        {
            level && level.forEach(unit => this.DrawUnit(unit));
        }

        const now = +new Date;
        const dt = Math.min((now - this.lastTick) / 1000, Renderer.MinFps);

        if(!this.noTick)
        {
            this.world.OnTick.Call(dt);
            await this.master.Step(dt);
        }
    
        if(!this.stop)
        {
            window.requestAnimationFrame(() => this.Render());
        }

        this.OnDraw.Call(dt);

        this.lastTick = now;
    }

    public SetCenter(center: Vector): void
    {
        this.center = center;
    }

    public Start(): void
    {
        this.lastTick = +new Date;
        this.stop = false;

        window.requestAnimationFrame(() => this.Render());
    }

    public Stop(): void
    {
        this.stop = true;
    }

    /**
     * Only the selected Z index will be rendered.
     */
    public SetSelectedZ(z: number)
    {
        this.selectedZ = z;
    }

    /**
     * The selected unit will have a border around it.
     */
    public SetSelectedUnit(unit: Unit)
    {
        this.selectedUnit = unit;
    }
}

class Mat4 
{
    /**
     * Makes an identity matrix.
     */
    public static Identity()
    {
        const output = new Float32Array(16);

        output[0] = 1;
        output[1] = 0;
        output[2] = 0;
        output[3] = 0;
        output[4] = 0;
        output[5] = 1;
        output[6] = 0;
        output[7] = 0;
        output[8] = 0;
        output[9] = 0;
        output[10] = 1;
        output[11] = 0;
        output[12] = 0;
        output[13] = 0;
        output[14] = 0;
        output[15] = 1;

        return output;
    }

    /**
     * Multiply by a scaling matrix.
     * @param input 
     * @param sx 
     * @param sy 
     * @param sz 
     */
    public static Scale(input: Float32Array, sx: number, sy: number, sz: number) 
    {
        const output = new Float32Array(16);

        output[0] = sx * input[0 * 4 + 0];
        output[1] = sx * input[0 * 4 + 1];
        output[2] = sx * input[0 * 4 + 2];
        output[3] = sx * input[0 * 4 + 3];
        output[4] = sy * input[1 * 4 + 0];
        output[5] = sy * input[1 * 4 + 1];
        output[6] = sy * input[1 * 4 + 2];
        output[7] = sy * input[1 * 4 + 3];
        output[8] = sz * input[2 * 4 + 0];
        output[9] = sz * input[2 * 4 + 1];
        output[10] = sz * input[2 * 4 + 2];
        output[11] = sz * input[2 * 4 + 3];

        if (input !== output) 
        {
            output[12] = input[12];
            output[13] = input[13];
            output[14] = input[14];
            output[15] = input[15];
        }

        return output;
    }

    /**
     * Multiply by translation matrix.
     * @param input 
     * @param tx 
     * @param ty 
     * @param tz 
     */
    public static Translate(input: Float32Array, tx: number, ty: number, tz: number)
    {
        const output = new Float32Array(16);

        const m00 = input[0];
        const m01 = input[1];
        const m02 = input[2];
        const m03 = input[3];
        const m10 = input[1 * 4 + 0];
        const m11 = input[1 * 4 + 1];
        const m12 = input[1 * 4 + 2];
        const m13 = input[1 * 4 + 3];
        const m20 = input[2 * 4 + 0];
        const m21 = input[2 * 4 + 1];
        const m22 = input[2 * 4 + 2];
        const m23 = input[2 * 4 + 3];
        const m30 = input[3 * 4 + 0];
        const m31 = input[3 * 4 + 1];
        const m32 = input[3 * 4 + 2];
        const m33 = input[3 * 4 + 3];

        if (input !== output) 
        {
            output[0] = m00;
            output[1] = m01;
            output[2] = m02;
            output[3] = m03;
            output[4] = m10;
            output[5] = m11;
            output[6] = m12;
            output[7] = m13;
            output[8] = m20;
            output[9] = m21;
            output[10] = m22;
            output[11] = m23;
        }

        output[12] = m00 * tx + m10 * ty + m20 * tz + m30;
        output[13] = m01 * tx + m11 * ty + m21 * tz + m31;
        output[14] = m02 * tx + m12 * ty + m22 * tz + m32;
        output[15] = m03 * tx + m13 * ty + m23 * tz + m33;

        return output;
    }

    /**
     * Makes a translation matrix.
     * @param tx 
     * @param ty 
     * @param tz 
     */
    public static Translation(tx: number, ty: number, tz: number) 
    {
        const output = new Float32Array(16);

        output[0] = 1;
        output[1] = 0;
        output[2] = 0;
        output[3] = 0;
        output[4] = 0;
        output[5] = 1;
        output[6] = 0;
        output[7] = 0;
        output[8] = 0;
        output[9] = 0;
        output[10] = 1;
        output[11] = 0;
        output[12] = tx;
        output[13] = ty;
        output[14] = tz;
        output[15] = 1;

        return output;
    }

    /**
     * Multiply by a Z rotation matrix.
     * @param other 
     * @param angle 
     */
    public static RotateZ(other: Float32Array, angle: number)
    {
        const output = new Float32Array(16);

        const m00 = other[0 * 4 + 0];
        const m01 = other[0 * 4 + 1];
        const m02 = other[0 * 4 + 2];
        const m03 = other[0 * 4 + 3];
        const m10 = other[1 * 4 + 0];
        const m11 = other[1 * 4 + 1];
        const m12 = other[1 * 4 + 2];
        const m13 = other[1 * 4 + 3];

        const c = Math.cos(angle);
        const s = Math.sin(angle);

        output[0] = c * m00 + s * m10;
        output[1] = c * m01 + s * m11;
        output[2] = c * m02 + s * m12;
        output[3] = c * m03 + s * m13;
        output[4] = c * m10 - s * m00;
        output[5] = c * m11 - s * m01;
        output[6] = c * m12 - s * m02;
        output[7] = c * m13 - s * m03;

        if (other !== output)
        {
            output[8] = other[8];
            output[9] = other[9];
            output[10] = other[10];
            output[11] = other[11];
            output[12] = other[12];
            output[13] = other[13];
            output[14] = other[14];
            output[15] = other[15];
        }

        return output;
    }

    /**
     * Computes a 4-by-4 orthographic projection matrix given the coordinates of the
     * planes defining the axis-aligned, box-shaped viewing volume. The matrix
     * generated sends that box to the unit box. Note that although left and right
     * are X coordinates and bottom and top are Y coordinates, near and far
     * are not Z coordinates, but rather they are distances along the negative
     * Z-axis. We assume a unit box extending from -1 to 1 in the X and Y
     * dimensions and from -1 to 1 in the Z dimension.
     * @param left The X coordinate of the left plane of the box.
     * @param right The X coordinate of the right plane of the box.
     * @param bottom The Y coordinate of the bottom plane of the box.
     * @param top The Y coordinate of the right plane of the box.
     * @param near The negative Z coordinate of the near plane of the box.
     * @param far The negative Z coordinate of the far plane of the box.
     */
    public static Orthographic(left: number, right: number, bottom: number, 
        top: number, near: number, far: number) 
    {
        const output = new Float32Array(16);

        output[0] = 2 / (right - left);
        output[1] = 0;
        output[2] = 0;
        output[3] = 0;
        output[4] = 0;
        output[5] = 2 / (top - bottom);
        output[6] = 0;
        output[7] = 0;
        output[8] = 0;
        output[9] = 0;
        output[10] = 2 / (near - far);
        output[11] = 0;
        output[12] = (left + right) / (left - right);
        output[13] = (bottom + top) / (bottom - top);
        output[14] = (near + far) / (near - far);
        output[15] = 1;

        return output;
    }

    /**
     * Multiply by translation matrix.
     * @param a 
     * @param b 
     */
    public static Multiply(a: Float32Array, b: Float32Array) 
    {
        const output = new Float32Array(16);

        const b00 = b[0 * 4 + 0];
        const b01 = b[0 * 4 + 1];
        const b02 = b[0 * 4 + 2];
        const b03 = b[0 * 4 + 3];
        const b10 = b[1 * 4 + 0];
        const b11 = b[1 * 4 + 1];
        const b12 = b[1 * 4 + 2];
        const b13 = b[1 * 4 + 3];
        const b20 = b[2 * 4 + 0];
        const b21 = b[2 * 4 + 1];
        const b22 = b[2 * 4 + 2];
        const b23 = b[2 * 4 + 3];
        const b30 = b[3 * 4 + 0];
        const b31 = b[3 * 4 + 1];
        const b32 = b[3 * 4 + 2];
        const b33 = b[3 * 4 + 3];
        const a00 = a[0 * 4 + 0];
        const a01 = a[0 * 4 + 1];
        const a02 = a[0 * 4 + 2];
        const a03 = a[0 * 4 + 3];
        const a10 = a[1 * 4 + 0];
        const a11 = a[1 * 4 + 1];
        const a12 = a[1 * 4 + 2];
        const a13 = a[1 * 4 + 3];
        const a20 = a[2 * 4 + 0];
        const a21 = a[2 * 4 + 1];
        const a22 = a[2 * 4 + 2];
        const a23 = a[2 * 4 + 3];
        const a30 = a[3 * 4 + 0];
        const a31 = a[3 * 4 + 1];
        const a32 = a[3 * 4 + 2];
        const a33 = a[3 * 4 + 3];

        output[0] = b00 * a00 + b01 * a10 + b02 * a20 + b03 * a30;
        output[1] = b00 * a01 + b01 * a11 + b02 * a21 + b03 * a31;
        output[2] = b00 * a02 + b01 * a12 + b02 * a22 + b03 * a32;
        output[3] = b00 * a03 + b01 * a13 + b02 * a23 + b03 * a33;
        output[4] = b10 * a00 + b11 * a10 + b12 * a20 + b13 * a30;
        output[5] = b10 * a01 + b11 * a11 + b12 * a21 + b13 * a31;
        output[6] = b10 * a02 + b11 * a12 + b12 * a22 + b13 * a32;
        output[7] = b10 * a03 + b11 * a13 + b12 * a23 + b13 * a33;
        output[8] = b20 * a00 + b21 * a10 + b22 * a20 + b23 * a30;
        output[9] = b20 * a01 + b21 * a11 + b22 * a21 + b23 * a31;
        output[10] = b20 * a02 + b21 * a12 + b22 * a22 + b23 * a32;
        output[11] = b20 * a03 + b21 * a13 + b22 * a23 + b23 * a33;
        output[12] = b30 * a00 + b31 * a10 + b32 * a20 + b33 * a30;
        output[13] = b30 * a01 + b31 * a11 + b32 * a21 + b33 * a31;
        output[14] = b30 * a02 + b31 * a12 + b32 * a22 + b33 * a32;
        output[15] = b30 * a03 + b31 * a13 + b32 * a23 + b33 * a33;

        return output;
    }
}

export class Mat4Stack
{
    private stack: Float32Array[];

    public constructor()
    {
        this.stack = [];

        // Since the stack is empty this will put an initial matrix in it
        this.Pop();
    }

    /**
     * Gets a copy of the current matrix (top of the stack)
     */
    public GetHead()
    {
        return this.stack[this.stack.length - 1].slice();
    }

    /**
     * Lets us set the current matrix
     * @param mat
     */
    public SetHead(mat: Float32Array)
    {
        this.stack[this.stack.length - 1] = mat;

        return mat;
    }

    /**
     * Pops the top of the stack restoring the previously saved matrix
     */
    public Pop()
    {
        this.stack.pop();

        // Never let the stack be totally empty
        if (this.stack.length < 1) {
            this.stack[0] = Mat4.Identity();
        }
    }

    /**
     * Pushes a copy of the current matrix on the stack
     */
    public Push()
    {
        this.stack.push(this.GetHead());
    }

    /**
     * Scales the current matrix
     * @param x 
     * @param y 
     * @param z 
     */
    public Scale(x: number, y: number, z: number = 1)
    {
        const mat = this.GetHead();

        this.SetHead(Mat4.Scale(mat, x, y, z));
    }

    /**
     * Translates the current matrix
     * @param x 
     * @param y 
     * @param z 
     */
    public Translate(x: number, y: number, z: number = 0)
    {
        const mat = this.GetHead();

        this.SetHead(Mat4.Translate(mat, x, y, z));
    }

    /**
     * Rotates the current matrix around Z
     * @param angle 
     */
    public RotateZ(angle: number)
    {
        const mat = this.GetHead();

        this.SetHead(Mat4.RotateZ(mat, angle));
    }
}