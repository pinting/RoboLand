const world = new World();
const size = 8;

const basePlayer = new PlayerActor();
const baseArrow = new ArrowActor();

baseArrow.Init({
    ignore: true,
    texture: "stone.png",
    damage: 0.01,
    speed: 1500,
    body: Body.CreateBox(new Vector(0.1, 0.1), 0, new Vector(0, 0))
});

basePlayer.Init({
    body: Body.CreateBox(new Vector(1, 1), 0, new Vector(2, 2)),
    texture: "player.png",
    speed: 1500,
    health: 1,
    rotSpeed: 200,
    baseArrow: baseArrow, ignore: true
});

world.Init({
    size: new Vector(size, size),
    basePlayer: basePlayer
});

// Init world with size x size number of GroundCells
for (let i = 0; i < size * size; i++) {
    let cell;

    if (i % (size - 1) == 0) {
        cell = new NormalCell();
        cell.Init({
            texture: "lamp.png",
            blocking: false,
            light: 6,
            body: Body.CreateBox(
                new Vector(1, 1),
                0,
                new Vector(i % size, (i - (i % size)) / size),
                {
                    z: 1,
                    density: Infinity
                })
        });
    }
    else if (i < size || i > size * size - size) {
        cell = new NormalCell();
        cell.Init({
            texture: "stone.png",
            blocking: true,
            body: Body.CreateBox(
                new Vector(1, 1),
                0,
                new Vector(i % size, (i - (i % size)) / size),
                {
                    z: 0,
                    density: Infinity
                })
        });
    }
    else {
        cell = new NormalCell();
        cell.Init({
            texture: "grass.png",
            blocking: false,
            body: Body.CreateBox(
                new Vector(1, 1),
                0,
                new Vector(i % size, (i - (i % size)) / size),
                {
                    z: 0,
                    density: Infinity
                })
        });
    }

    world.Add(cell);
}