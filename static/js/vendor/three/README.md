# Three.js 0.180.0

Vendored from the official `three@0.180.0` npm package for the isolated Future preview.
The upstream MIT license is included in `LICENSE`.

Files: `build/three.module.js`, `build/three.core.js`, and the OrbitControls,
RoomEnvironment, and RoundedBoxGeometry addons. Addon imports of `three` are
rewritten to `./three.module.js` so the existing static-site build can serve
the modules locally without import maps or an external CDN.

The original collection-inspired procedural scene is in `../../future-3d.js`.
These scenes are concept illustrations, not measurements or CAD replicas of
the physical products. Product photographs remain in the collection cards.
