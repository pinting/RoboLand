/**
 * Inner class to speed upp gradient computations
 */
class Grad
{
    public X: number;
    public Y: number;
    public Z: number;
    public W: number;

    constructor(x: number, y: number, z: number, w?: number)
    {
        this.X = x;
        this.Y = y;
        this.Z = z;
        this.W = w;
    }
}

/*
 * A speed-improved simplex noise algorithm for 2D, 3D in TypeScript.
 *
 * Based on example code by Stefan Gustavson (stegu@itn.liu.se).
 * Optimisations by Peter Eastman (peastman@drizzle.stanford.edu).
 * TypeScript version by Denes Tornyi (tornyi.denes@gmail.com).
 *
 * This could be speeded up even further, but it's useful as it is.
 *
 * This code was placed in the public domain by its original author,
 * Stefan Gustavson. You may use it as you see fit, but
 * attribution is appreciated.
 */
export class SimplexNoise 
{
    private static grad3: Grad[] = [
        new Grad(1, 1, 0),
        new Grad(-1, 1, 0),
        new Grad(1, -1, 0),
        new Grad(-1, -1, 0),
        new Grad(1, 0, 1),
        new Grad(-1, 0, 1),
        new Grad(1, 0, -1),
        new Grad(-1, 0, -1),
        new Grad(0, 1, 1),
        new Grad(0, -1, 1),
        new Grad(0, 1, -1),
        new Grad(0, -1, -1)
    ];

    private static p: number[] = [
        151, 160, 137, 91, 90, 15, 131, 13, 201, 95, 96, 53, 194, 
        233, 7, 225, 140, 36, 103, 30, 69, 142, 8, 99, 37, 240, 
        21, 10, 23, 190, 6, 148, 247, 120, 234, 75, 0, 26, 197, 62, 
        94, 252, 219, 203, 117, 35, 11, 32, 57, 177, 33, 88, 237, 
        149, 56, 87, 174, 20, 125, 136, 171, 168, 68, 175, 74, 165, 
        71, 134, 139, 48, 27, 166, 77, 146, 158, 231, 83, 111, 229, 
        122, 60, 211, 133, 230, 220, 105, 92, 41, 55, 46, 245, 40, 244,
        102, 143, 54, 65, 25, 63, 161, 1, 216, 80, 73, 209, 76, 132, 187, 
        208, 89, 18, 169, 200, 196, 135, 130, 116, 188, 159, 86, 164, 100, 
        109, 198, 173, 186, 3, 64, 52, 217, 226, 250, 124, 123, 5, 202, 38, 
        147, 118, 126, 255, 82, 85, 212, 207, 206, 59, 227, 47, 16, 58, 17, 
        182, 189, 28, 42, 223, 183, 170, 213, 119, 248, 152, 2, 44, 154, 163, 
        70, 221, 153, 101, 155, 167, 43, 172, 9, 129, 22, 39, 253, 19, 98, 
        108, 110, 79, 113, 224, 232, 178, 185, 112, 104, 218, 246, 97, 228,
        251, 34, 242, 193, 238, 210, 144, 12, 191, 179, 162, 241, 81, 51, 
        145, 235, 249, 14, 239, 107, 49, 192, 214, 31, 181, 199, 106, 157, 
        184, 84, 204, 176, 115, 121, 50, 45, 127, 4, 150, 254, 138, 236, 
        205, 93, 222, 114, 67, 29, 24, 72, 243, 141, 128, 195, 78, 66, 215, 
        61, 156, 180
    ];

    // To clean the need for index wrapping, double the permutation table length
    private static perm: number[] = null;
    private static permMod12: number[] = null;

    // Skewing and unskewing factors for 2, 3 dimensions
    private static readonly F2: number = 0.5 * (Math.sqrt(3.0) - 1.0);
    private static readonly G2: number = (3.0 - Math.sqrt(3.0)) / 6.0;
    private static readonly F3: number = 1.0 / 3.0;
    private static readonly G3: number = 1.0 / 6.0;

    private static Init() 
    {
        if(SimplexNoise.perm && SimplexNoise.permMod12)
        {
            return;
        }

        SimplexNoise.perm = [];
        SimplexNoise.permMod12 = [];

        for(let i = 0; i < 512; i++)
        {
            SimplexNoise.perm[i] = SimplexNoise.p[i & 255];
            SimplexNoise.permMod12[i] = SimplexNoise.perm[i] % 12;
        }
    }

    private static Dot(g: Grad, x: number, y: number, z?: number, w?: number): number {
        if(z && w) 
        {
            return g.X * x + g.Y * y + g.Z * z + g.W * w;
        }
        else if(z)
        {
            return g.X * x + g.Y * y + g.Z * z;
        }
        else
        {
            return g.X * x + g.Y * y;
        }
    }

    /**
     * 2D simplex noise
     * @param xin 
     * @param yin 
     */
    public static Noise2D(xin: number, yin: number): number 
    {
        SimplexNoise.Init();

        // Noise contributions from the three corners
        let n0: number;
        let n1: number;
        let n2: number;

        // Skew the input space to determine which simplex cell we're in
        let s: number = (xin + yin) * SimplexNoise.F2; // Hairy factor for 2D
        let i: number = Math.floor(xin + s);
        let j: number = Math.floor(yin + s);
        let t: number = (i + j) * SimplexNoise.G2;
        let X0: number = i - t; // Unskew the cell origin back to (X, Y) space
        let Y0: number = j - t;
        let x0: number = xin - X0; // The X, Y distances from the cell origin
        let y0: number = yin - Y0;

        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.

        // Offsets for second (middle) corner of simplex in (i, j) vectors
        let i1: number;
        let j1: number; 

        if (x0 > y0) 
        {
            // Lower triangle, XY order: (0, 0) -> (1, 0) -> (1, 1)
            i1 = 1;
            j1 = 0;
        }
        else 
        {
            // Upper triangle, YX order: (0, 0) -> (0, 1) -> (1, 1)
            i1 = 0;
            j1 = 1;
        }

        // A step of (1, 0) in (i, j) means a step of (1 - c, -c) in (X, Y), and
        // a step of (0, 1) in (i, j) means a step of (-c, 1 - c) in (X, Y), where
        // c = (3 - sqrt(3)) / 6

        let x1: number = x0 - i1 + SimplexNoise.G2; // Offsets for middle corner in (X, Y) unskewed vectors
        let y1: number = y0 - j1 + SimplexNoise.G2;
        let x2: number = x0 - 1.0 + 2.0 * SimplexNoise.G2; // Offsets for last corner in (X, Y) unskewed vectors
        let y2: number = y0 - 1.0 + 2.0 * SimplexNoise.G2;

        // Work out the hashed gradient indices of the three simplex corners
        let ii: number = i & 255;
        let jj: number = j & 255;
        let gi0: number = SimplexNoise.permMod12[ii + SimplexNoise.perm[jj]];
        let gi1: number = SimplexNoise.permMod12[ii + i1 + SimplexNoise.perm[jj + j1]];
        let gi2: number = SimplexNoise.permMod12[ii + 1 + SimplexNoise.perm[jj + 1]];

        // Calculate the contribution from the three corners
        let t0: number = 0.5 - x0*x0-y0*y0;

        if (t0 < 0) 
        {
            n0 = 0.0;
        }
        else 
        {
            t0 *= t0;
            n0 = t0 * t0 * SimplexNoise.Dot(SimplexNoise.grad3[gi0], x0, y0);  // (X, Y) of grad3 used for 2D gradient
        }

        let t1: number = 0.5 - x1 * x1 - y1 * y1;

        if (t1 < 0)
        {
            n1 = 0.0;
        }
        else 
        {
            t1 *= t1;
            n1 = t1 * t1 * SimplexNoise.Dot(SimplexNoise.grad3[gi1], x1, y1);
        }

        let t2: number = 0.5 - x2 * x2 - y2 * y2;

        if (t2 < 0)
        {
            n2 = 0.0;
        }
        else 
        {
            t2 *= t2;
            n2 = t2 * t2 * SimplexNoise.Dot(SimplexNoise.grad3[gi2], x2, y2);
        }
        
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1, 1].
        return 70.0 * (n0 + n1 + n2);
    }

    /**
     * 3D simplex noise
     * @param xin 
     * @param yin 
     * @param zin 
     */
    public static Noise3D(xin: number, yin: number, zin: number): number
    {
        SimplexNoise.Init();

        // Noise contributions from the four corners
        let n0: number;
        let n1: number;
        let n2: number;
        let n3: number;

        // Skew the input space to determine which simplex cell we're in
        let s: number = (xin + yin + zin) * SimplexNoise.F3; // Very nice and simple skew factor for 3D
        let i: number = Math.floor(xin + s);
        let j: number = Math.floor(yin + s);
        let k: number = Math.floor(zin + s);
        let t: number = (i + j + k) * SimplexNoise.G3;
        let X0: number = i - t; // Unskew the cell origin back to (X, Y, Z) space
        let Y0: number = j - t;
        let Z0: number = k - t;
        let x0: number = xin - X0; // The X, Y, Z distances from the cell origin
        let y0: number = yin - Y0;
        let z0: number = zin - Z0;

        // For the 3D case, the simplex shape is a slightly irregular tetrahedron.
        // Determine which simplex we are in.

        // Offsets for second corner of simplex in (i, j, k) vectors
        let i1: number;
        let j1: number;
        let k1: number;

        // Offsets for third corner of simplex in (i, j, k) vectors
        let i2: number;
        let j2: number;
        let k2: number;

        if (x0 >= y0) {
            if (y0 >= z0) 
            {
                // X Y Z order
                i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 1; k2 = 0; 
            }
            else if (x0 >= z0) 
            {
                // X Z Y order 
                i1 = 1; j1 = 0; k1 = 0; i2 = 1; j2 = 0; k2 = 1; 
            }
            else 
            {
                // Z X Y order
                i1 = 0; j1 = 0; k1 = 1; i2 = 1; j2 = 0; k2 = 1; 
            }
        }
        else {
            // x0 < y0
            if (y0 < z0) { i1 = 0; j1 = 0; k1 = 1; i2 = 0; j2 = 1; k2 = 1; } // Z Y X order
            else if (x0 < z0) { i1 = 0; j1 = 1; k1 = 0; i2 = 0; j2 = 1; k2 = 1; } // Y Z X order
            else { i1 = 0; j1 = 1; k1 = 0; i2 = 1; j2 = 1; k2 = 0; } // Y X Z order
        }

        // A step of (1, 0, 0) in (i, j, k) means a step of (1 - c , -c, -c) in (X, Y, Z),
        // a step of (0, 1, 0) in (i, j, k) means a step of (-c, 1-c, -c) in (X, Y, Z), and
        // a step of (0, 0, 1) in (i, j, k) means a step of (-c, -c, 1-c) in (X, Y, Z), where
        // c = 1 / 6.
        let x1 = x0 - i1 + SimplexNoise.G3; // Offsets for second corner in (X, Y, Z) vectors
        let y1 = y0 - j1 + SimplexNoise.G3;
        let z1 = z0 - k1 + SimplexNoise.G3;
        let x2 = x0 - i2 + 2.0 * SimplexNoise.G3; // Offsets for third corner in (X, Y, Z) vectors
        let y2 = y0 - j2 + 2.0 * SimplexNoise.G3;
        let z2 = z0 - k2 + 2.0 * SimplexNoise.G3;
        let x3 = x0 - 1.0 + 3.0 * SimplexNoise.G3; // Offsets for last corner in (X, Y, Z) vectors
        let y3 = y0 - 1.0 + 3.0 * SimplexNoise.G3;
        let z3 = z0 - 1.0 + 3.0 * SimplexNoise.G3;

        // Work out the hashed gradient indices of the four simplex corners
        let ii: number = i & 255;
        let jj: number = j & 255;
        let kk: number = k & 255;
        let gi0: number = SimplexNoise.permMod12[ii + SimplexNoise.perm[jj + SimplexNoise.perm[kk]]];
        let gi1: number = SimplexNoise.permMod12[ii + i1 + SimplexNoise.perm[jj + j1 + SimplexNoise.perm[kk + k1]]];
        let gi2: number = SimplexNoise.permMod12[ii + i2 + SimplexNoise.perm[jj + j2 + SimplexNoise.perm[kk + k2]]];
        let gi3: number = SimplexNoise.permMod12[ii + 1 + SimplexNoise.perm[jj + 1 + SimplexNoise.perm[kk + 1]]];

        // Calculate the contribution from the four corners
        let t0: number = 0.6 - x0 * x0 - y0 * y0 - z0 * z0;

        if (t0 < 0) 
        {
            n0 = 0.0;
        }
        else 
        {
            t0 *= t0;
            n0 = t0 * t0 * SimplexNoise.Dot(SimplexNoise.grad3[gi0], x0, y0, z0);
        }

        let t1: number = 0.6 - x1 * x1 - y1 * y1 - z1 * z1;

        if (t1 < 0) {
            n1 = 0.0;
        }
        else 
        {
            t1 *= t1;
            n1 = t1 * t1 * SimplexNoise.Dot(SimplexNoise.grad3[gi1], x1, y1, z1);
        }

        let t2: number = 0.6 - x2 * x2 - y2 * y2 - z2 * z2;

        if (t2 < 0) 
        {
            n2 = 0.0;
        }
        else 
        {
            t2 *= t2;
            n2 = t2 * t2 * SimplexNoise.Dot(SimplexNoise.grad3[gi2], x2, y2, z2);
        }

        let t3: number = 0.6 - x3 * x3 - y3 * y3 - z3 * z3;

        if (t3 < 0) 
        {
            n3 = 0.0;
        }
        else 
        {
            t3 *= t3;
            n3 = t3 * t3 * SimplexNoise.Dot(SimplexNoise.grad3[gi3], x3, y3, z3);
        }

        // Add contributions from each corner to get the final noise value.
        // The result is scaled to stay just inside [-1, 1]
        return 32.0 * (n0 + n1 + n2 + n3);
    }
}