// Class contains methods for loading Gltf and obj models
class Loader {
	/**
	 * Open object from the given URL.
	 * File will be loaded asynchronously.
	 * @param[in] {string} theModelPath model path
	 * @param[in] {function} onLoad on load callback
	 * @return {Promise} loading promise
	 */
	openGltfFromUrl(theModelPath, onLoad) {

		const aLoader = new THREE.GLTFLoader();
		const aPromise = new Promise((theResolve, theReject) => {
			aLoader.load(theModelPath,
				(theGltf) => {
					onLoad(this.onModelLoaded(theGltf.scene));
					theResolve(true);
				},
				(theProress) => { },
				(theError) => { theReject(theError); }
			);
		});
		return aPromise;
	}

	/**
	 * Open object from the given URL.
	 * File will be loaded asynchronously.
	 * @param[in] {string} theModelPath model path
	 * @param[in] {function} onLoad on load callback
	 * @return {Promise} loading promise
	 */
	openObjFromUrl(theModelPath, onLoad) {

		const aLoader = new THREE.OBJLoader();
		const aPromise = new Promise((theResolve, theReject) => {
			aLoader.load(theModelPath,
				(theObj) => {
					onLoad(this.onModelLoaded(theObj));
					theResolve(true);
				},
				(theProress) => { },
				(theError) => { theReject(theError); }
			);
		});
		return aPromise;
	}

	/**
	 * Handle object loading
	 * @param[in] {any} theModel model object
	 * @returns {} 
	 */
	onModelLoaded(theModel) {
		const aMatMap = new Map();
		theModel.traverse(function (theChild) {
			if (theChild.isMesh) {
				let aMatObjects = aMatMap.get(theChild.material.name);
				if (aMatObjects === undefined) {
					aMatObjects = [];
					aMatMap.set(theChild.material.name, aMatObjects);
				}
				aMatObjects.push(theChild);
			}

			if (theChild.isLineSegments) {
				if (theChild.isConditionalLine) {
					theChild.visible = true;
				} else {
					theChild.visible = true;
				}
			}
			if (!theChild.visible) {
				theChild.visible = true;
			}
		});

		let aModelRoot = new THREE.Group();
		theModel.updateMatrixWorld();
		for (let [aMatName, aMeshes] of aMatMap) {
			const aGeomList = [];
			for (let i = 0; i < aMeshes.length; ++i) {
				const aMesh = aMeshes[i];
				let aGeom = aMesh.geometry.clone();
				aGeom.applyMatrix4(aMesh.matrixWorld);
				aGeomList.push(aGeom);
				const anEdges = new THREE.EdgesGeometry(aGeom, 180);
				const aLine = new THREE.LineSegments(anEdges, new THREE.LineBasicMaterial({ color: 'black', linewidth: 1 }));
				aModelRoot.add(aLine);
			}

			const aMaterial = aMeshes[0].material;
			aMaterial.polygonOffset = true;
			aMaterial.polygonOffsetFactor = 1;
			aMaterial.polygonOffsetUnits = 1;
			const aGeom = THREE.BufferGeometryUtils.mergeBufferGeometries(aGeomList);
			if (!aGeom) { continue; }
			const aNode = new THREE.Mesh(aGeom, aMaterial);
			aNode.castShadow = true;
			aNode.receiveShadow = true;
			aModelRoot.add(aNode);
		}

		return aModelRoot;
	}
}