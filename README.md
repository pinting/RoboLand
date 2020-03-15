# RoboLand

RoboLand is an open source 2D video game engine with P2P networking I develop in my spare time.

<img src="https://github.com/pinting/RoboLand/raw/master/screenshot.png" width="600" />

Watch a potato [recording](https://youtu.be/qVQ_61eYZTw) about the current features.

Check out the [demo](https://pinting.github.io/RoboLand/)!

Or try with the [devtools](https://pinting.github.io/RoboLand/#view=devtools)!

## Setup

Run `npm install` and `npm start`. It should work from Node 8 to 12 using Chrome 80.

## Want to dig in?

The game is based on a World which contains Units. Each Unit can be an Actor or a Cell. Actors are dynamic, have movement, they are walking on Cells - which are static, usually with an infinite weight.

Under Net there is a text based sync implementation. It uses channels to communicate (under Net/Channel), currently an internal async channel (FakeChnanel) and a WebRTC based one (PeerChannel). The Server class handles its own World, the clients are synced up on connect and continued to be synced with relative changes. Once in every N sec, upon change, the server sends out an absolute change of a Unit, so it will not get lost. The clients are only applying changes if the difference is large enough.

Physics is handled by the World in every OnTick cycle - which comes from the OnDraw event of the Renderer, max 60 times per second. Each object is calculated against each other. If there is a collision between the Bodies, it will be resolved by the ResolveCollision function located in the Body class.

RoboPack packages can be packed and unpacked with a command line utility. Run `npm link` after setting up the project to install the binaries. After run `roboland pack` in a folder you wish to pack or `roboland unpack <file>` to unpack a bundle.

## TODOs

- WebGL based renderer.
- Importing and exporting Dump hiearchies into the engine should not break the structure. Save relations to export them the same way. Also World Editor should have a feature to create new Units based on Dumps. Currently only brand new Units can be created only.
- Image view for the resource explorer.
- Shape/Polygon Editor.
- Add circles to Geometry.
- Use IndexedDB to manage different workplaces (packs).
- Fix networking optimization
- Write tests for network optimization.
- Add sandboxes.
- Add action scripts - small scripts saved into the world file and run on world events.
- Move platform dependent code into a dynamically attached module.
- Move each instance of the game into different workers. (Renderer needs to be redirected. A new communication layer is needed under FakeChannel and IndirectRenderer. Can be called WorkerBridge.)
- Sound manager. Action scripts could play sounds from Resources, the volume would depent on the distance from the creator of the sound.
- Animations. The change of the texture could be handled by the Unit itself, so the Renderer can stay the same.
- Fix physical glitch which causes two overlaying shapes to not collide.

## Credits

- Stefan Gustavson - For your simplex noise implementation
- Jim Riecken - Thanks, I learnt a lot from SAT.js
- William Bittle - For his 2D physics engine, dyn4j
- Randy Gaul - For his great ImpulseEngine from which I ported parts
- Ábel Neczpál - For realising my rotating function was messed up

## Contributing

Anyone can help make this project better.

## License

Copyright (c) 2020 Dénes Tornyi. Licensed under the Apache license.