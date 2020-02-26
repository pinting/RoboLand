# RoboLand

Check out the [demo](https://pinting.github.io/RoboLand/)!

Or try with the [devtools](https://pinting.github.io/RoboLand/#view=devtools)!

## Setup

Run `npm install` and `npm start`. It should work from Node 8 to 12.

## Want to dig in?

The game is based on a World which contains Units. Each Unit can be an Actor or a Cell. Actors are dynamic, have movement, they are walking on Cells - which are static, usually with an infinite weight.

Under Net there is a text based sync implementation. It uses channels to communicate (under Net/Channel), currently an internal async channel (FakeChnanel) and a WebRTC based one (PeerChannel). The Server class handles its own World, the clients are synced up on connect and continued to be synced with relative changes. Once in every N sec, upon change, the server sends out an absolute change of a Unit, so the client will not get lost. The clients are only applying changes if they are large enough.

Physics is handled by the World in every OnTick cycle - which comes from the OnDraw event of the Renderer, max 60 times per second. Each object is calculated against each other. If there is a collision between the Bodies, it will be resolved by the ResolveCollision function located in the Body class.

Geometry holds the basic Math under the engine. Vector, Matrix and shapes based on these. Overlap contains the SAT algorithm.

RoboPack packages can be packed and unpacked via commands. Run `npm link` after setting up the project.

## TODO

- Fix physical glitch which causes two overlaying shapes to not collide.
- WebGL based renderer.
- Importing and exporting Dump hiearchies into the engine should not break the structure. Save relations to export them the same way.
- Image view for the resource explorer.
- Shape/Polygon editor.
- Add circles.
- Use IndexedDB to manage different workplaces (packs).
- Fix networking optimization
- Write test for network optimization.
- Add sandboxes.
- Add action scripts - small scripts saved into the world file and run on world events.
- Move platform dependent code into a dynamically attached module.
- Move each instance of the game into different workers. (Renderer needs to be redirected. A new communication layer is needed under FakeChannel and IndirectRenderer. Can be called WorkerBridge.)

## Credits

- Stefan Gustavson - For your simplex noise implementation
- Jim Riecken - Thanks, I learnt a lot from SAT.js
- William Bittle - For his 2D physics engine, dyn4j
- Randy Gaul - For his great ImpulseEngine from which I ported parts
- Ábel Neczpál - For realising my rotating function was messed up

## Contributing

Anyone can help make this project better.

## License

Copyright (c) 2020 Dénes Tornyi. Licensed under the Apache License license.