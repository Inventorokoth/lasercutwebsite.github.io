// Auxiliary class for managing 3D Viewer scene.
class Viewer {

	constructor(theCanvas) {
		this.myScene = new THREE.Scene();
		this.myModels = new Array();
		this.myIsShowEdges = true;
		this.myUseDirectionalLight = false;

		let aGlCtx = theCanvas.getContext('webgl2', { alpha: false, depth: true, antialias: true, preserveDrawingBuffer: true });
		if (aGlCtx == null) { aGlCtx = theCanvas.getContext('webgl', { alpha: false, depth: true, antialias: true, preserveDrawingBuffer: true }); }
		this.myCamera = new THREE.PerspectiveCamera(5, theCanvas.width / theCanvas.height, 0.1, 1000);
		//fov, aspect, near, far
		//this.myCamera = new THREE.OrthographicCamera( theCanvas.width / - 2, theCanvas.width / 2, theCanvas.height / 2, theCanvas.height / - 2, 0.1, 1000 );
		//near, far
		this.myRenderer = new THREE.WebGLRenderer({ antialias: true, canvas: theCanvas, context: aGlCtx });
		this.myRenderer.autoClear = true;
		this.myRenderer.autoClearColor = true;
		this.myRenderer.autoClearDepth = true;
		this.myRenderer.autoClearStencil = true;
		this.myRenderer.setSize(theCanvas.width, theCanvas.height);
		this.myRenderer.outputEncoding = THREE.sRGBEncoding;

		this.myControls = new THREE.OrbitControls(this.myCamera, theCanvas);
		this.myControls.target.set(0, 0, -0.2);
		this.myControls.update();
		this.myControls.addEventListener('change', () => { this.updateView(); });
		this.myControls.enableZoom = false;
		this.myControls.enablePan = false;

		this.myScene.background = this.generateCubeTexture(64, new THREE.Color(1.0, 1.0, 1.0));
		this.myScene.add(new THREE.HemisphereLight(0xffeeb1, 0x080820, 0.5));
	}

	/**
	 * Sets directional light
	 * @param[in] {boolean} theIsUse enable/disable directional light
	 * @param[in] {boolean} theToUpdate immediately request viewer update
	 */
	useDirectionalLight(theIsUse, theToUpdate) {
		if (this.myUseDirectionalLight === theIsUse) {
			return;
		}
		this.myUseDirectionalLight = theIsUse;
		if (!theIsUse) {
			this.myScene.remove(this.myCamera);
			this.myCamera.remove(this.myLight);
			this.myLight = null;
		} else {
			this.myLight = new THREE.DirectionalLight(0xffa95c, 4);
			this.myLight.position.set(0, 0, 0);
			this.myLight.castShadow = true;
			this.myCamera.add(this.myLight);
			this.myScene.add(this.myCamera);
		}
		if (theToUpdate) { this.updateView(); }
	}

	/** Add model to scene.
	 *  @param[in] {string} theName name of model
	 *  @param[in] {THREE.Object3D} theObject 
	 */
	addModel(theName, theObject) {
		this.removeObject(theName, false);
		this.myScene.add(theObject);

		let aModel = new Model(theName, theObject);
		aModel.setEdgesVisibility(this.myIsShowEdges);
		aModel.setEnvMap(this.myScene.background);
		if (this.myModelColor !== undefined) {
			aModel.setCustomColor(this.myModelColor);
		}
		this.myModels.push(aModel);
	}

	/** Change background color.
	 *  @param[in] {THREE.Color} theColor background color
	 */
	setBackgroundColor(theColor) {
		this.myScene.background = this.generateCubeTexture(128, theColor);
		for (let aModel of this.myModels) {
			aModel.setEnvMap(this.myScene.background);
		}
		this.updateView();
	}

	/** Change color of all models.
	 *  @param[in] {THREE.Color} theColor
	 *  @param[in] {boolean} theToUpdate immediately request viewer update
	 */
	setColorAllModels(theColor, theToUpdate) {
		this.myModelColor = theColor;
		for (let aModel of this.myModels) {
			aModel.setCustomColor(theColor);
		}
		if (theToUpdate) { this.updateView(); }
	}

	/** Change color of model by name.
	 *  @param[in] {THREE.Color} theColor
	 *  @param[in] {boolean} theToUpdate immediately request viewer update
	 */
	setModelColor(theName, theColor, theToUpdate) {
		let aModel = this.getModelByName(theName);
		if (aModel !== undefined) {
			aModel.setCustomColor(theColor);
			if (theToUpdate) { this.updateView(); }
			return true;
		}
		return false;
	}

	/**
     * Sets edges visibility
     * @param[in] {boolean} theIsVisible 
	 * @param[in] {boolean} theToUpdate immediately request viewer update
     */
	setEdgesVisibility(theIsVisible, theToUpdate) {
		if (this.myIsShowEdges === theIsVisible) {
			return;
		}
		this.myIsShowEdges = theIsVisible;
		for (let aModel of this.myModels) {
			aModel.setEdgesVisibility(theIsVisible);
		}
		if (theToUpdate) { this.updateView(); }
	}

	/** Generate monochrome texture.
	 *  @param[in] {number} theHeight 
	 *  @param[in] {THREE.Color} theColor texture color
	 *  @return {THREE.CubeTexture} resuting texture
	 */
	generateCubeTexture(theSize, theColor) {
		var aPxNum = theSize * theSize;
		var aData = new Uint8Array(4 * aPxNum);

		var r = Math.floor(theColor.r * 255);
		var g = Math.floor(theColor.g * 255);
		var b = Math.floor(theColor.b * 255);

		for (var anIter = 0; anIter < aPxNum; anIter++) {
			aData[anIter * 4] = r;
			aData[anIter * 4 + 1] = g;
			aData[anIter * 4 + 2] = b;
			aData[anIter * 4 + 3] = 0;
		}

		var aTexture = new THREE.DataTexture(aData, theSize, theSize);
		aTexture.needsUpdate = true;

		var aCubeTexture = new THREE.CubeTexture();
		for (let i = 0; i < 6; ++i) {
			aCubeTexture.images[i] = aTexture;
		}
		aCubeTexture.needsUpdate = true;

		return aCubeTexture;
	}

	/** Compute AABB of main scene content.
	 *  @return {THREE.Box3} computed box
	 */
	getSceneBox() {
		const aBox = new THREE.Box3();
		for (let aModel of this.myModels) {
			aBox.expandByObject(aModel.object());
		}
		return aBox;
	}

	/** Fit all objects into view.
	 *  @param[in] {boolean} theToUpdate immediately request viewer update
	 */
	fitAllObjects(theToUpdate) {
		const aBox = this.getSceneBox();
		if (aBox.isEmpty()) {
			return;
		}
		const aFitOffset = 1.2
		const aSize = aBox.getSize(new THREE.Vector3());
		const aCenter = aBox.getCenter(new THREE.Vector3());

		const aMaxSize = Math.max(aSize.x, aSize.y, aSize.z);
		const aFitHeightDist = aMaxSize / (2 * Math.atan(Math.PI * this.myCamera.fov / 360));
		const aFitWidthDist = aFitHeightDist / this.myCamera.aspect;
		const aDist = aFitOffset * Math.max(aFitHeightDist, aFitWidthDist);

		const aDir = this.myControls.target.clone()
			.sub(this.myCamera.position).normalize().multiplyScalar(aDist);
		this.myControls.maxDistance = aDist * 10;
		this.myControls.target.copy(aCenter);

		this.myCamera.near = aDist / 100;
		this.myCamera.far = aDist * 100;
		this.myCamera.updateProjectionMatrix();

		this.myCamera.position.copy(this.myControls.target).sub(aDir);
		this.myControls.update();

		if (theToUpdate) { this.updateView(); }
	}

	/** Set camera look direction and up vector.
	 *  @param {THREE.Vector3} look look direction.
	 *  @param {THREE.Vector3} up head-up vector.
	 *  @param[in] {boolean} theToUpdate immediately request viewer update
	 */
	setCameraLookAt(look, up, theToUpdate) {
		let globalBounds = this.getSceneBox();
		if (globalBounds.isEmpty()) {
			return;
		}
		let boundSphere = new THREE.Sphere();
		globalBounds.getBoundingSphere(boundSphere);
		let dist = this.myCamera.isPerspectiveCamera ?
			boundSphere.radius / Math.tan(Math.PI * this.myCamera.fov / 360) :
			boundSphere.radius * 2.0;
		let newCameraPos = boundSphere.center.clone();
		let lookDir = look.clone().normalize();
		lookDir.multiplyScalar(-dist);
		newCameraPos.add(lookDir);

		let zoom = this.myCamera.zoom;
		if (this.myCamera.isOrthographicCamera) {
			let width = Math.abs(this.myCamera.right - this.myCamera.left);
			let height = Math.abs(this.myCamera.top - this.myCamera.bottom);
			if (width < height) {
				zoom = 1.0 / (2.0 * boundSphere.radius / width);
			}
			else {
				zoom = 1.0 / (2.0 * boundSphere.radius / height);
			}
		}

		this.myCamera.position.copy(boundSphere.center.add(lookDir));
		this.myCamera.lookAt(boundSphere.center);
		this.myCamera.up.copy(up);
		this.myCamera.zoom = zoom;

		this.fitAllObjects(theToUpdate);
	}

	/**
	 * Redraw the view.
	 */
	updateView() {
		this.myRenderer.render(this.myScene, this.myCamera);
	}

	/**
	 * Resize viewer.
	 * @param[in] {number}  theWidth    new width
	 * @param[in] {number}  theHeight   new height
	 * @param[in] {boolean} theToUpdate immediately request viewer update
	 * @return {boolean} FALSE if object was not found
	 */
	resizeView(theWidth, theHeight, theToUpdate) {
		this.myRenderer.setSize(theWidth, theHeight);
		this.myCamera.aspect = theWidth / theHeight;
		this.myCamera.updateProjectionMatrix();
		if (theToUpdate) { this.updateView(); }
	}

	/**
	 * Remove all objects.
	 */
	removeAllObjects(theToUpdate) {
		for (let aModel of this.myModels) {
			this.removeObject(aModel.name(), false);
		}
		if (theToUpdate) { this.updateView(); }
	}

	/**
	 * Remove named object from viewer.
	 * @param[in] {string}  theName     object name
	 * @param[in] {boolean} theToUpdate immediately request viewer update
	 * @return {boolean} FALSE if object was not found
	 */
	removeObject(theName, theToUpdate) {
		let aModel = this.getModelByName(theName);
		if (aModel !== undefined) {
			this.myScene.remove(aModel.object());
			const anIdx = this.myModels.indexOf(aModel);
			if (anIdx > -1) {
				this.myModels.splice(anIdx, 1);
			}
			if (theToUpdate) { this.updateView(); }
			return true;
		}
		return false;
	}

	/**
	 * Get model by name.
	 * @param[in] {string} theName model name
	 * @return {Model} 
	 */
	getModelByName(theName) {
		for (let aModel of this.myModels) {
			if (aModel.name() === theName) {
				return aModel;
			}
		}
		return undefined;
	}

}