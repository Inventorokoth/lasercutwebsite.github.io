// Class for managing models.
class Model {

    constructor(theName, theModel) {

        this.myName = theName;
        this.myObject = theModel;
        this.myHasCustomColor = false;
        this.myColor = new THREE.Color();
        this.myIsEdgesVisible = true;
    }

    /**
     * Returns model name
     * @returns {string} model name
     */
    name() {
        return this.myName;
    }

    /**
     * Returns 3D object
     * @returns {THREE.Object3D} scene object
     */
    object() {
        return this.myObject;
    }

    /**
     * Returns edges visibility
     * @returns {boolean} true if edges are visible
     */
    isEdgesVisible() {
        return this.myIsEdgesVisible;
    }

    /**
     * Sets edges visibility
     * @param[in] {boolean} theIsVisible 
     */
    setEdgesVisibility(theIsVisible) {
        if (theIsVisible === this.myIsEdgesVisible) {
            return;
        }
        this.myIsEdgesVisible = theIsVisible;
        for (let aChild of this.myObject.children) {
            if (aChild.isLine) {
                aChild.visible = theIsVisible;
            }
        }
    }

    /**
     * Suts cstom model color
     * @param[in] {THREE.Color} theColor
     */
    setCustomColor(theColor) {
        this.myHasCustomColor = true;
        this.myColor = theColor;

        for (let aChild of this.myObject.children) {
            if (aChild.isMesh) {
                aChild.material.color = theColor;
            }
        }
    }

    /**
     * Sets model environment map
     * @param[in] {THREE.CubeTexture} theEnvMap
     */
    setEnvMap(theEnvMap) {
        for (let aChild of this.myObject.children) {
            if (aChild.isMesh) {
                aChild.material.envMap = theEnvMap;
            }
        }
    }

}