/* 四壁光影模板生成器 - 完整闭环与大图预览版 */

class FourWallShadowCutter {
    constructor() {
        this.originalImage = null;
        this.binaryImageData = null;
        
        this.wallTextures = []; // 0:上, 1:左, 2:下, 3:右
        this.baseTexture = null; // 新增：盒子覆盖在底面上的图案
        
        this.isFirstLoad = true;
        this.shouldInvert = false;
        this.isCalculating = false;
        this.lidRecommendation = "等待图片...";
        this.hasIslandWarning = false;
        
        this.tScene = null; this.tCamera = null; this.tRenderer = null;
        this.tBoxGroup = null; this.tLightSphere = null; this.tPlanes = [];
        this.tShadowBox = null; this.tActualShadow = null; this.tRaysGroup = null;
        this.tLabels = []; 
        
        this.initUI();
        this.loadDefaultImage(); 
    }
    
    initUI() {
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        uploadArea.addEventListener('dragover', (e) => { e.preventDefault(); uploadArea.style.borderColor = '#4361ee'; });
        uploadArea.addEventListener('dragleave', () => { uploadArea.style.borderColor = '#ddd'; });
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault(); uploadArea.style.borderColor = '#ddd';
            if (e.dataTransfer.files.length > 0) this.loadImage(e.dataTransfer.files[0]);
        });
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) this.loadImage(e.target.files[0]);
        });
        
        const bindDoubleInput = (id, type) => {
            const slider = document.getElementById(id);
            const numInput = document.getElementById(`${id}-num`);
            
            const updateAction = (val) => {
                slider.value = val;
                numInput.value = val;
                
                if (type === 'image' && this.originalImage) {
                    this.processImage();
                } else if (type === 'physics') {
                    if (['box-width', 'box-height', 'box-depth'].includes(id)) {
                        this.updateLightLimits();
                    }
                    this.updateThreeJSBox(); 
                }
            };

            slider.addEventListener('input', (e) => updateAction(e.target.value));
            numInput.addEventListener('input', (e) => {
                let val = parseFloat(e.target.value);
                const min = parseFloat(slider.min);
                const max = parseFloat(slider.max);
                if (isNaN(val)) return;
                if (val < min) val = min;
                if (val > max) val = max;
                updateAction(val);
            });
            numInput.addEventListener('blur', (e) => updateAction(slider.value)); 
        };
        
        bindDoubleInput('threshold', 'image');
        bindDoubleInput('box-width', 'physics');
        bindDoubleInput('box-height', 'physics');
        bindDoubleInput('box-depth', 'physics');
        bindDoubleInput('light-height', 'physics');
        bindDoubleInput('light-x', 'physics');
        bindDoubleInput('light-y', 'physics');
        bindDoubleInput('shadow-height', 'physics');
        
        document.getElementById('toggle-invert').addEventListener('click', () => {
            this.shouldInvert = !this.shouldInvert;
            document.getElementById('auto-invert-value').textContent = this.shouldInvert ? '已反转' : '默认';
            if (this.originalImage) {
                this.isFirstLoad = false;
                this.processImage();
            }
        });
        
        document.getElementById('process-btn').addEventListener('click', () => this.startCalculation());
        document.getElementById('download-pdf-btn').addEventListener('click', () => this.generatePDF());
        
        // 绑定点击查看大图
        this.bindThumbnailClicks();

        this.updateLightLimits(); 
        this.updateSteps(1);
        this.initThreeJS();
    }

    bindThumbnailClicks() {
        const thumbBtnIds = ['thumb-btn-base', 'thumb-btn-top', 'thumb-btn-left', 'thumb-btn-bottom', 'thumb-btn-right'];
        const titles = ['盒子底面裁切图', '上边墙裁切图', '左边墙裁切图', '下边墙裁切图', '右边墙裁切图'];
        
        thumbBtnIds.forEach((btnId, idx) => {
            const btn = document.getElementById(btnId);
            btn.addEventListener('click', () => {
                let textureData = idx === 0 ? this.baseTexture : this.wallTextures[idx - 1];
                if (!textureData) return;
                this.openModal(titles[idx], textureData);
            });
        });
    }

    openModal(title, imageData) {
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('modal-img');
        const caption = document.getElementById('modal-caption');
        
        const canvas = document.createElement('canvas');
        canvas.width = imageData.width;
        canvas.height = imageData.height;
        const ctx = canvas.getContext('2d');
        ctx.putImageData(imageData, 0, 0);
        
        // 画一圈红色的边界线，方便用户在纯白背景下看清纸板的边缘
        ctx.strokeStyle = '#ef233c';
        ctx.lineWidth = Math.max(1, Math.ceil(imageData.width / 200));
        ctx.strokeRect(0, 0, canvas.width, canvas.height);
        
        modalImg.src = canvas.toDataURL('image/png');
        caption.textContent = title;
        modal.style.display = "block";
    }

    updateLightLimits() {
        const boxW = parseFloat(document.getElementById('box-width').value);
        const boxH = parseFloat(document.getElementById('box-height').value);
        const boxD = parseFloat(document.getElementById('box-depth').value);
        
        const setLimits = (id, minVal, maxVal) => {
            const slider = document.getElementById(id);
            const num = document.getElementById(`${id}-num`);
            slider.min = minVal; slider.max = maxVal;
            num.min = minVal; num.max = maxVal;
            
            let current = parseFloat(slider.value);
            if (current > maxVal) { slider.value = maxVal; num.value = maxVal; }
            if (current < minVal) { slider.value = minVal; num.value = minVal; }
        };
        
        const limitX = Math.max(0, boxW / 2 - 0.5);
        const limitY = Math.max(0, boxH / 2 - 0.5);
        const limitZ = Math.max(1, boxD - 0.5); 
        
        setLimits('light-x', -limitX, limitX);
        setLimits('light-y', -limitY, limitY);
        setLimits('light-height', 1, limitZ);
    }

    loadDefaultImage() {
        const img = new Image();
        img.crossOrigin = "Anonymous";
        img.onload = () => {
            this.originalImage = img;
            requestAnimationFrame(() => {
                this.drawPreviewCanvas('preview-original', this.originalImage);
                requestAnimationFrame(() => {
                    this.isFirstLoad = true;
                    this.processImage();
                });
            });
        };
        img.onerror = () => {
            console.log("未检测到本地 default.png，自动加载内置基础测试图案。");
            img.src = "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSIyMDAiIGhlaWdodD0iMjAwIj4gPHJlY3Qgd2lkdGg9IjIwMCIgaGVpZ2h0PSIyMDAiIGZpbGw9IndoaXRlIi8+IDxwYXRoIGQ9Ik0xMDAsMTAgTDEyNSw3MCBMMTkwLDcwIEwxNDAsMTEwIEwxNjAsMTgwIEwxMDAsMTQwIEw0MCwxODAgTDYwLDExMCBMMTAsNzAgTDc1LDcwIFoiIGZpbGw9ImJsYWNrIi8+IDwvc3ZnPg==";
        };
        img.src = './default.png';
    }

    createTextSprite(message) {
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 128;
        const ctx = canvas.getContext('2d');
        ctx.font = "bold 50px 'Noto Sans SC', sans-serif";
        ctx.fillStyle = "#fff";
        
        ctx.beginPath(); ctx.roundRect(10, 30, 108, 68, 15); ctx.fillStyle="#4361ee"; ctx.fill();
        
        ctx.fillStyle = "#fff"; ctx.textAlign = "center"; ctx.textBaseline = "middle";
        ctx.fillText(message, 64, 64);
        
        const texture = new THREE.CanvasTexture(canvas);
        const spriteMaterial = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.8 });
        const sprite = new THREE.Sprite(spriteMaterial);
        sprite.scale.set(5, 5, 1); 
        return sprite;
    }

    initThreeJS() {
        const container = document.getElementById('threejs-container');
        this.tScene = new THREE.Scene();
        this.tScene.background = new THREE.Color(0xe9ecef);
        
        this.tCamera = new THREE.PerspectiveCamera(50, container.clientWidth / container.clientHeight, 0.1, 1000);
        this.tCamera.position.set(30, 40, 50);

        this.tRenderer = new THREE.WebGLRenderer({ antialias: true });
        this.tRenderer.setSize(container.clientWidth, container.clientHeight);
        container.appendChild(this.tRenderer.domElement);

        const controls = new THREE.OrbitControls(this.tCamera, this.tRenderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.05;

        const gridHelper = new THREE.GridHelper(200, 200, 0x888888, 0xcccccc);
        gridHelper.position.y = 0; 
        this.tScene.add(gridHelper);

        this.tBoxGroup = new THREE.Group();
        this.tScene.add(this.tBoxGroup);

        const mat = new THREE.MeshBasicMaterial({ color: 0x4361ee, side: THREE.DoubleSide, transparent: true, opacity: 0.15 });
        for (let i = 0; i < 4; i++) {
            const plane = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat.clone());
            this.tPlanes.push(plane);
            this.tBoxGroup.add(plane);
        }

        const labelTexts = ['上', '左', '下', '右'];
        for (let i = 0; i < 4; i++) {
            const sprite = this.createTextSprite(labelTexts[i]);
            this.tLabels.push(sprite);
            this.tBoxGroup.add(sprite);
        }

        const sphereGeo = new THREE.SphereGeometry(0.8, 16, 16);
        const sphereMat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
        this.tLightSphere = new THREE.Mesh(sphereGeo, sphereMat);
        this.tScene.add(this.tLightSphere);
        
        const shadowPreviewGeo = new THREE.PlaneGeometry(1, 1);
        const shadowPreviewMat = new THREE.MeshBasicMaterial({ color: 0x444444, transparent: true, opacity: 0.1, side: THREE.DoubleSide });
        this.tShadowBox = new THREE.Mesh(shadowPreviewGeo, shadowPreviewMat);
        this.tShadowBox.rotation.x = -Math.PI / 2;
        this.tShadowBox.position.y = 0.05; 
        this.tScene.add(this.tShadowBox);

        const actualShadowMat = new THREE.MeshBasicMaterial({ color: 0x000000, transparent: true, opacity: 0.85, side: THREE.DoubleSide, alphaTest: 0.05 });
        this.tActualShadow = new THREE.Mesh(shadowPreviewGeo, actualShadowMat);
        this.tActualShadow.rotation.x = -Math.PI / 2;
        this.tActualShadow.position.y = 0.1;
        this.tActualShadow.visible = false;
        this.tScene.add(this.tActualShadow);

        this.tRaysGroup = new THREE.Group();
        this.tScene.add(this.tRaysGroup);

        window.addEventListener('resize', () => {
            this.tCamera.aspect = container.clientWidth / container.clientHeight;
            this.tCamera.updateProjectionMatrix();
            this.tRenderer.setSize(container.clientWidth, container.clientHeight);
        });

        const animate = () => {
            requestAnimationFrame(animate);
            controls.update();
            this.tRenderer.render(this.tScene, this.tCamera);
        };
        animate();
        
        this.updateThreeJSBox(); 
    }

    updateThreeJSBox() {
        if (!this.tBoxGroup) return;
        const boxW = parseFloat(document.getElementById('box-width').value);
        const boxH = parseFloat(document.getElementById('box-height').value);
        const boxD = parseFloat(document.getElementById('box-depth').value);
        const lightH = parseFloat(document.getElementById('light-height').value);
        
        const lightX = parseFloat(document.getElementById('light-x').value);
        const lightY = parseFloat(document.getElementById('light-y').value);
        
        const shadowH = parseFloat(document.getElementById('shadow-height').value);
        let aspect = 1;
        if (this.binaryImageData) {
            aspect = this.binaryImageData.width / this.binaryImageData.height;
        } else if (this.originalImage) {
            aspect = this.originalImage.width / this.originalImage.height;
        }
        const shadowW = shadowH * aspect;
        
        this.tPlanes[0].scale.set(boxW, boxD, 1);
        this.tPlanes[0].position.set(0, boxD / 2, -boxH / 2);
        this.tPlanes[0].rotation.set(0, 0, 0);

        this.tPlanes[1].scale.set(boxH, boxD, 1);
        this.tPlanes[1].position.set(-boxW / 2, boxD / 2, 0);
        this.tPlanes[1].rotation.set(0, Math.PI / 2, 0);

        this.tPlanes[2].scale.set(boxW, boxD, 1);
        this.tPlanes[2].position.set(0, boxD / 2, boxH / 2);
        this.tPlanes[2].rotation.set(0, Math.PI, 0);

        this.tPlanes[3].scale.set(boxH, boxD, 1);
        this.tPlanes[3].position.set(boxW / 2, boxD / 2, 0);
        this.tPlanes[3].rotation.set(0, -Math.PI / 2, 0);

        this.tLabels[0].position.set(0, boxD / 2, -boxH / 2 - 2.5);
        this.tLabels[1].position.set(-boxW / 2 - 2.5, boxD / 2, 0);
        this.tLabels[2].position.set(0, boxD / 2, boxH / 2 + 2.5);
        this.tLabels[3].position.set(boxW / 2 + 2.5, boxD / 2, 0);

        this.tLightSphere.position.set(lightX, lightH, -lightY);
        
        this.tShadowBox.scale.set(shadowW, shadowH, 1);
        this.tShadowBox.visible = true; 
        
        if (this.tActualShadow) this.tActualShadow.visible = false;
        if (this.tRaysGroup) this.tRaysGroup.visible = false;
        
        for(let i=0; i<4; i++) {
            this.tPlanes[i].material.map = null;
            this.tPlanes[i].material.color.setHex(0x4361ee);
            this.tPlanes[i].material.opacity = 0.15;
            this.tPlanes[i].material.needsUpdate = true;
        }
    }

    applyTexturesToThreeJS() {
        for (let i = 0; i < 4; i++) {
            if (!this.wallTextures[i]) continue;
            
            const srcData = this.wallTextures[i];
            const canvas = document.createElement('canvas');
            canvas.width = srcData.width; canvas.height = srcData.height;
            const ctx = canvas.getContext('2d');
            
            const modifiedData = new ImageData(new Uint8ClampedArray(srcData.data), srcData.width, srcData.height);
            for(let j=0; j<modifiedData.data.length; j+=4) {
                if (modifiedData.data[j] === 255 && modifiedData.data[j+1] === 255 && modifiedData.data[j+2] === 255) {
                    modifiedData.data[j+3] = 0; 
                } else {
                    modifiedData.data[j+3] = 220; 
                }
            }
            ctx.putImageData(modifiedData, 0, 0);
            
            const texture = new THREE.CanvasTexture(canvas);
            texture.magFilter = THREE.NearestFilter;
            
            this.tPlanes[i].material.map = texture;
            this.tPlanes[i].material.color.setHex(0xffffff);
            this.tPlanes[i].material.opacity = 1.0;
            this.tPlanes[i].material.transparent = true;
            this.tPlanes[i].material.alphaTest = 0.1; 
            this.tPlanes[i].material.needsUpdate = true;
        }
    }

    showPostCalculation3D() {
        if (!this.binaryImageData) return;
        this.tShadowBox.visible = false; 

        const shadowH = parseFloat(document.getElementById('shadow-height').value);
        const w = this.binaryImageData.width;
        const h = this.binaryImageData.height;
        const shadowW = shadowH * (w / h);

        const shadowCanvas = document.createElement('canvas');
        shadowCanvas.width = w; shadowCanvas.height = h;
        const ctx = shadowCanvas.getContext('2d');
        const sData = new ImageData(new Uint8ClampedArray(this.binaryImageData.data), w, h);

        const edgePoints = []; 

        for(let y=0; y<h; y++) {
            for(let x=0; x<w; x++) {
                const idx = (y*w+x)*4;
                if(sData.data[idx] === 0) { 
                    sData.data[idx+3] = 220; 
                    if(y>0 && y<h-1 && x>0 && x<w-1) {
                        if(sData.data[idx-4] !== 0 || sData.data[idx+4] !== 0 || sData.data[idx-w*4] !== 0 || sData.data[idx+w*4] !== 0) {
                            edgePoints.push({x, y});
                        }
                    }
                } else {
                    sData.data[idx+3] = 0; 
                }
            }
        }
        ctx.putImageData(sData, 0, 0);

        const texture = new THREE.CanvasTexture(shadowCanvas);
        texture.magFilter = THREE.LinearFilter;
        this.tActualShadow.material.map = texture;
        this.tActualShadow.material.needsUpdate = true;
        this.tActualShadow.scale.set(shadowW, shadowH, 1);
        this.tActualShadow.visible = true;

        while(this.tRaysGroup.children.length > 0) {
            this.tRaysGroup.remove(this.tRaysGroup.children[0]);
        }

        const lightH = parseFloat(document.getElementById('light-height').value);
        const lightX = parseFloat(document.getElementById('light-x').value);
        const lightY = parseFloat(document.getElementById('light-y').value);
        
        const lightPos = new THREE.Vector3(lightX, lightH, -lightY);
        const rayMat = new THREE.LineBasicMaterial({color: 0xffcc00, transparent: true, opacity: 0.15});

        const step = Math.max(1, Math.floor(edgePoints.length / 80));
        for(let i=0; i<edgePoints.length; i+=step) {
            const pt = edgePoints[i];
            const gx = (pt.x / w - 0.5) * shadowW;
            const gz = (pt.y / h - 0.5) * shadowH; 
            const pts = [lightPos, new THREE.Vector3(gx, 0.1, gz)];
            const geo = new THREE.BufferGeometry().setFromPoints(pts);
            const line = new THREE.Line(geo, rayMat);
            this.tRaysGroup.add(line);
        }
        this.tRaysGroup.visible = true;
    }

    showLoader(text, showProgress = false) {
        document.getElementById('loader-text').textContent = text;
        document.getElementById('global-loader').style.display = 'flex';
        document.querySelector('.progress-bar').style.display = showProgress ? 'block' : 'none';
        document.getElementById('progress-text').style.display = showProgress ? 'block' : 'none';
    }
    
    updateLoaderProgress(percent) {
        document.getElementById('progress-fill').style.width = `${percent}%`;
        document.getElementById('progress-text').textContent = `${percent}%`;
    }
    
    hideLoader() {
        document.getElementById('global-loader').style.display = 'none';
    }

    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                requestAnimationFrame(() => {
                    this.drawPreviewCanvas('preview-original', this.originalImage);
                    requestAnimationFrame(() => {
                        this.isFirstLoad = true;
                        this.processImage();
                    });
                });
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    processImage() {
        if (!this.originalImage) return;
        
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = this.originalImage.width;
        canvas.height = this.originalImage.height;
        ctx.drawImage(this.originalImage, 0, 0);
        
        this.binaryImageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        const data = this.binaryImageData.data;
        const threshold = parseFloat(document.getElementById('threshold').value);
        for (let i = 0; i < data.length; i += 4) {
            const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
            const value = gray > threshold ? 255 : 0;
            data[i] = data[i + 1] = data[i + 2] = value;
        }
        
        if (this.isFirstLoad) {
            this.autoDetectInvert();
            this.isFirstLoad = false;
        }
        
        if (this.shouldInvert) {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i]; data[i + 1] = 255 - data[i + 1]; data[i + 2] = 255 - data[i + 2];
            }
        }
        
        this.drawPreviewImageData('preview-binary', this.binaryImageData);
        this.checkCenterRegion();
        this.updateThreeJSBox(); 
        this.updateSteps(2);
    }
    
    autoDetectInvert() {
        const data = this.binaryImageData.data;
        const w = this.binaryImageData.width, h = this.binaryImageData.height;
        let edgeWhiteCount = 0, edgeTotalCount = 0;
        
        for (let x = 0; x < w; x++) {
            if (data[(0 * w + x) * 4] === 255) edgeWhiteCount++;
            if (data[((h - 1) * w + x) * 4] === 255) edgeWhiteCount++;
            edgeTotalCount += 2;
        }
        for (let y = 1; y < h - 1; y++) {
            if (data[(y * w + 0) * 4] === 255) edgeWhiteCount++;
            if (data[(y * w + (w - 1)) * 4] === 255) edgeWhiteCount++;
            edgeTotalCount += 2;
        }
        
        this.shouldInvert = (edgeWhiteCount / edgeTotalCount) < 0.5;
        document.getElementById('auto-invert-value').textContent = this.shouldInvert ? '已反转' : '默认';
    }
    
    checkCenterRegion() {
        const data = this.binaryImageData.data;
        const w = this.binaryImageData.width, h = this.binaryImageData.height;
        const cx = Math.floor(w / 2), cy = Math.floor(h / 2);
        const radius = Math.floor(Math.min(w, h) * 0.05);
        
        let darkCount = 0, totalCount = 0;
        for (let y = cy - radius; y <= cy + radius; y++) {
            for (let x = cx - radius; x <= cx + radius; x++) {
                if (x >= 0 && x < w && y >= 0 && y < h) {
                    if (data[(y * w + x) * 4] === 0) darkCount++;
                    totalCount++;
                }
            }
        }
        
        const centerIsDark = darkCount / totalCount > 0.5;
        this.lidRecommendation = centerIsDark ? "建议封起顶部" : "顶部留空即可";
        const valEl = document.getElementById('lid-recommendation-value');
        const txtEl = document.getElementById('lid-recommendation-text');
        
        if (centerIsDark) {
            valEl.textContent = "必须把盒子顶部封起来"; valEl.style.color = "#ef233c";
            txtEl.textContent = "中央区域需要阴影，因此必须遮挡正上方直射的光线。";
        } else {
            valEl.textContent = "顶部镂空敞开即可"; valEl.style.color = "#4cc9f0";
            txtEl.textContent = "中央区域要求明亮，顶部需要让光线直接透过去。";
        }
    }
    
    drawPreviewCanvas(id, imageSource) {
        const canvas = document.getElementById(id);
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(imageSource, 0, 0, canvas.width, canvas.height);
    }
    
    drawPreviewImageData(id, imgData) {
        const canvas = document.getElementById(id);
        const ctx = canvas.getContext('2d');
        const tempC = document.createElement('canvas');
        tempC.width = imgData.width; tempC.height = imgData.height;
        tempC.getContext('2d').putImageData(imgData, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(tempC, 0, 0, canvas.width, canvas.height);
    }

    detectAndHighlightIslands(wallImgData) {
        const w = wallImgData.width;
        const h = wallImgData.height;
        const data = wallImgData.data;
        
        const isSolid = (x, y) => data[(y * w + x) * 4] < 250;
        
        let visited = new Uint8Array(w * h);
        let queue = new Int32Array(w * h);
        let qHead = 0, qTail = 0;
        
        for (let x = 0; x < w; x++) {
            if (isSolid(x, 0)) { queue[qTail++] = 0 * w + x; visited[0 * w + x] = 1; }
            if (isSolid(x, h - 1)) { queue[qTail++] = (h - 1) * w + x; visited[(h - 1) * w + x] = 1; }
        }
        for (let y = 0; y < h; y++) {
            if (isSolid(0, y) && !visited[y * w]) { queue[qTail++] = y * w + 0; visited[y * w] = 1; }
            if (isSolid(w - 1, y) && !visited[y * w + w - 1]) { queue[qTail++] = y * w + (w - 1); visited[y * w + w - 1] = 1; }
        }
        
        const dx = [-1, 1, 0, 0], dy = [0, 0, -1, 1];
        while (qHead < qTail) {
            const curr = queue[qHead++];
            const cx = curr % w;
            const cy = Math.floor(curr / w);
            
            for (let i = 0; i < 4; i++) {
                const nx = cx + dx[i];
                const ny = cy + dy[i];
                if (nx >= 0 && nx < w && ny >= 0 && ny < h) {
                    const nIdx = ny * w + nx;
                    if (!visited[nIdx] && isSolid(nx, ny)) {
                        visited[nIdx] = 1;
                        queue[qTail++] = nIdx;
                    }
                }
            }
        }
        
        let islandFound = false;
        for (let y = 0; y < h; y++) {
            for (let x = 0; x < w; x++) {
                if (isSolid(x, y) && !visited[y * w + x]) {
                    islandFound = true;
                    const idx = (y * w + x) * 4;
                    data[idx] = 255;     // 红
                    data[idx + 1] = 0;   // 绿
                    data[idx + 2] = 0;   // 蓝
                }
            }
        }
        return islandFound;
    }
    
    async startCalculation() {
        if (!this.binaryImageData) { alert('请先上传图片！'); return; }
        
        this.isCalculating = true;
        this.hasIslandWarning = false;
        document.getElementById('island-warning').style.display = 'none';
        
        this.updateSteps(3);
        this.updateLoaderProgress(0);
        this.showLoader('正在生成图纸...', true);
        
        setTimeout(() => this.executeChunkedRaycasting(), 100);
    }
    
    async executeChunkedRaycasting() {
        const boxW = parseFloat(document.getElementById('box-width').value);
        const boxH = parseFloat(document.getElementById('box-height').value);
        const boxD = parseFloat(document.getElementById('box-depth').value);
        
        const lightH = parseFloat(document.getElementById('light-height').value);
        const lightX = parseFloat(document.getElementById('light-x').value);
        const lightY = parseFloat(document.getElementById('light-y').value);
        
        const shadowH = parseFloat(document.getElementById('shadow-height').value);
        const imgW = this.binaryImageData.width;
        const imgH = this.binaryImageData.height;
        const shadowW = shadowH * (imgW / imgH); 
        
        const pxPerCm = 30; 
        
        const walls = [
            { name: 'top', w: boxW, h: boxD, get3D: (c, r) => ({ x: c/pxPerCm - boxW/2, y: boxH/2, z: boxD - r/pxPerCm }) },
            { name: 'left', w: boxH, h: boxD, get3D: (c, r) => ({ x: -boxW/2, y: boxH/2 - c/pxPerCm, z: boxD - r/pxPerCm }) },
            { name: 'bottom', w: boxW, h: boxD, get3D: (c, r) => ({ x: c/pxPerCm - boxW/2, y: -boxH/2, z: boxD - r/pxPerCm }) },
            { name: 'right', w: boxH, h: boxD, get3D: (c, r) => ({ x: boxW/2, y: c/pxPerCm - boxH/2, z: boxD - r/pxPerCm }) }
        ];
        
        this.wallTextures = [];
        let totalPixels = walls.reduce((s, w) => s + Math.ceil(w.w * pxPerCm) * Math.ceil(w.h * pxPerCm), 0);
        let processed = 0;
        const binData = this.binaryImageData.data;
        
        for (let wi = 0; wi < 4; wi++) {
            if (!this.isCalculating) return;
            
            const wall = walls[wi];
            const wPx = Math.ceil(wall.w * pxPerCm);
            const hPx = Math.ceil(wall.h * pxPerCm);
            const wallImg = new ImageData(wPx, hPx);
            
            const chunkRows = 10;
            
            for (let row = 0; row < hPx; row += chunkRows) {
                if (!this.isCalculating) return;
                const endRow = Math.min(row + chunkRows, hPx);
                
                for (let r = row; r < endRow; r++) {
                    for (let c = 0; c < wPx; c++) {
                        const p3d = wall.get3D(c, r);
                        let isSolid = false;
                        const dz = p3d.z - lightH;
                        
                        if (dz >= 0) {
                            isSolid = true; 
                        } else {
                            const t = -lightH / dz; 
                            const groundX = lightX + t * (p3d.x - lightX);
                            const groundY = lightY + t * (p3d.y - lightY);
                            
                            const imgPx = Math.round((groundX / shadowW + 0.5) * imgW);
                            const imgPy = Math.round((-groundY / shadowH + 0.5) * imgH); 
                            
                            if (imgPx >= 0 && imgPx < imgW && imgPy >= 0 && imgPy < imgH) {
                                const idx = (imgPy * imgW + imgPx) * 4;
                                if (binData[idx] === 0) isSolid = true;
                            }
                        }
                        
                        const dIdx = (r * wPx + c) * 4;
                        const color = isSolid ? 220 : 255; 
                        wallImg.data[dIdx] = color;
                        wallImg.data[dIdx+1] = color;
                        wallImg.data[dIdx+2] = color;
                        wallImg.data[dIdx+3] = 255;
                    }
                }
                
                processed += (endRow - row) * wPx;
                this.updateLoaderProgress(Math.floor((processed / totalPixels) * 100));
                await new Promise(res => setTimeout(res, 0));
            }
            
            if (this.detectAndHighlightIslands(wallImg)) {
                this.hasIslandWarning = true;
            }
            
            this.wallTextures.push(wallImg);
        }

        // ================= 新增：生成盒子底面的图纸 =================
        if (this.isCalculating) {
            const wBasePx = Math.ceil(boxW * pxPerCm);
            const hBasePx = Math.ceil(boxH * pxPerCm);
            const baseImg = new ImageData(wBasePx, hBasePx);
            
            for(let r = 0; r < hBasePx; r++) {
                for(let c = 0; c < wBasePx; c++) {
                    const x = c / pxPerCm - boxW / 2;
                    const y = boxH / 2 - r / pxPerCm;
                    
                    const imgPx = Math.round((x / shadowW + 0.5) * imgW);
                    const imgPy = Math.round((-y / shadowH + 0.5) * imgH); 
                    
                    let color = 255; // 默认透光(白)
                    if (imgPx >= 0 && imgPx < imgW && imgPy >= 0 && imgPy < imgH) {
                        const idx = (imgPy * imgW + imgPx) * 4;
                        if (binData[idx] === 0) color = 220; // 阴影留纸板(灰)
                    }
                    
                    const dIdx = (r * wBasePx + c) * 4;
                    baseImg.data[dIdx] = color;
                    baseImg.data[dIdx+1] = color;
                    baseImg.data[dIdx+2] = color;
                    baseImg.data[dIdx+3] = 255;
                }
            }
            // 对底面也进行一次孤岛检查
            if (this.detectAndHighlightIslands(baseImg)) {
                this.hasIslandWarning = true;
            }
            this.baseTexture = baseImg;
        }
        
        if (this.isCalculating) {
            this.isCalculating = false;
            this.drawWallThumbnails();
            this.applyTexturesToThreeJS();
            this.showPostCalculation3D(); 
            this.hideLoader();
            this.updateSteps(4);
            
            if (this.hasIslandWarning) {
                document.getElementById('island-warning').style.display = 'block';
            }
        }
    }
    
    drawWallThumbnails() {
        const drawThumb = (id, idx) => {
            const canvas = document.getElementById(id);
            const ctx = canvas.getContext('2d');
            
            let wallData = idx === 0 ? this.baseTexture : this.wallTextures[idx - 1];
            if (!wallData) return;
            
            canvas.width = wallData.width;
            canvas.height = wallData.height;
            
            const tempC = document.createElement('canvas');
            tempC.width = wallData.width; tempC.height = wallData.height;
            tempC.getContext('2d').putImageData(wallData, 0, 0);
            
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(tempC, 0, 0);
            
            ctx.strokeStyle = ['#2b2d42', '#ff4444', '#44ff44', '#4444ff', '#ffaa00'][idx];
            ctx.lineWidth = 4;
            ctx.strokeRect(0, 0, canvas.width, canvas.height);
        };
        
        drawThumb('thumb-base', 0);
        drawThumb('thumb-top', 1);
        drawThumb('thumb-left', 2);
        drawThumb('thumb-bottom', 3);
        drawThumb('thumb-right', 4);
    }
    
    async generatePDF() {
        if (this.wallTextures.length === 0 || !this.baseTexture) { alert('请先生成图纸！'); return; }
        this.showLoader('正在拼装 A4 图纸...');
        
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            
            this.drawCoverCanvasForPDF(pdf);
            
            // 加入底面图纸作为第 2 页
            pdf.addPage('a4', 'portrait');
            this.drawBaseCanvasForPDF(pdf);
            
            const orientMap = ['landscape', 'portrait', 'landscape', 'portrait'];
            for (let i = 0; i < 4; i++) {
                pdf.addPage('a4', orientMap[i]);
                this.drawWallCanvasForPDF(pdf, i, orientMap[i]);
            }
            
            pdf.save(`光影纸盒裁切图纸_${new Date().getTime()}.pdf`);
        } catch (error) {
            alert('PDF下载失败: ' + error.message);
        } finally {
            this.hideLoader();
        }
    }
    
    drawCoverCanvasForPDF(pdf) {
        const canvas = document.getElementById('pdf-cover-canvas');
        const ctx = canvas.getContext('2d');
        const dpi = 150, wPX = Math.round(210 * dpi / 25.4), hPX = Math.round(297 * dpi / 25.4);
        
        canvas.width = wPX; canvas.height = hPX;
        ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, wPX, hPX);
        ctx.fillStyle = '#4361ee'; ctx.font = `bold ${24 * dpi/72}px Arial`; 
        ctx.fillText('光影纸盒裁切图纸', 25 * dpi/25.4, 40 * dpi/25.4);
        
        ctx.fillStyle = '#333'; ctx.font = `${14 * dpi/72}px Arial`;
        let y = 70 * dpi/25.4;
        const txt = (str, color='#333') => { ctx.fillStyle = color; ctx.fillText(str, 25 * dpi/25.4, y); y += 12 * dpi/25.4; };
        
        txt(`纸盒长度(X): ${document.getElementById('box-width').value} cm`);
        txt(`纸盒宽度(Y): ${document.getElementById('box-height').value} cm`);
        txt(`纸盒深度(Z): ${document.getElementById('box-depth').value} cm`);
        txt(`灯泡距底高度: ${document.getElementById('light-height').value} cm`);
        const lx = document.getElementById('light-x').value;
        const ly = document.getElementById('light-y').value;
        txt(`灯泡平面位置: X偏移 ${lx} cm, Y偏移 ${ly} cm`);
        txt(`拼装建议: ${this.lidRecommendation}`);
        
        y += 15 * dpi/25.4;
        txt('【 剪裁说明 】', '#ef233c');
        txt('1. 【灰色区域】：保留纸板，不要剪。');
        txt('2. 【白色区域】：用刻刀全部掏空，让光透出去。');
        if (this.hasIslandWarning) {
            txt('3. 【红色区域】：提示！这是悬空的图案，全剪会掉下来。', '#ef233c');
            txt('   剪的时候必须留一条纸连着，或者用透明胶带从背面固定！', '#ef233c');
        }
        
        y += 20 * dpi/25.4;
        txt('⚠️ 打印属性提示：', '#4361ee');
        txt('本PDF包含 6 页（封面 + 1张底面 + 4张侧墙）。', '#333');
        txt('本图纸已严格按 1:1 比例生成。打印时请务必在打印机设置中', '#333');
        txt('选择【实际大小】或【100% 缩放】。绝不要选择“适应纸张”！', '#333');
        
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297);
    }

    drawBaseCanvasForPDF(pdf) {
        const canvas = document.getElementById('pdf-base-canvas');
        const ctx = canvas.getContext('2d');
        const dpi = 150, scalePX = dpi / 25.4;
        const widthMM = 210, heightMM = 297; // 竖向 A4
        const wPX = widthMM * scalePX, hPX = heightMM * scalePX;
        
        canvas.width = wPX; canvas.height = hPX;
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, wPX, hPX);
        
        const tempC = document.createElement('canvas');
        tempC.width = this.baseTexture.width; tempC.height = this.baseTexture.height;
        tempC.getContext('2d').putImageData(this.baseTexture, 0, 0);
        
        const physW = tempC.width / 30 * 10;
        const physH = tempC.height / 30 * 10;
        const offsetX = (wPX - physW * scalePX) / 2;
        const offsetY = (hPX - physH * scalePX) / 2;
        
        ctx.drawImage(tempC, offsetX, offsetY, physW * scalePX, physH * scalePX);
        
        ctx.strokeStyle = '#2b2d42'; ctx.lineWidth = 1 * scalePX; ctx.setLineDash([5*scalePX, 5*scalePX]);
        ctx.strokeRect(offsetX, offsetY, physW * scalePX, physH * scalePX);
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#d90429'; ctx.font = `bold ${12 * dpi/72}px Arial`; ctx.textAlign = 'center';
        ctx.fillText(`↑ 盒子底面图案 (可垫在盒子下方或贴于外部) ↑`, wPX/2, offsetY - 5 * scalePX);
        
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, widthMM, heightMM);
    }
    
    drawWallCanvasForPDF(pdf, wallIndex, orientation) {
        const canvasId = ['pdf-top-canvas', 'pdf-left-canvas', 'pdf-bottom-canvas', 'pdf-right-canvas'][wallIndex];
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        const dpi = 150, scalePX = dpi / 25.4;
        const widthMM = orientation === 'portrait' ? 210 : 297;
        const heightMM = orientation === 'portrait' ? 297 : 210;
        const wPX = widthMM * scalePX, hPX = heightMM * scalePX;
        
        canvas.width = wPX; canvas.height = hPX;
        ctx.fillStyle = 'white'; ctx.fillRect(0, 0, wPX, hPX);
        
        const wallData = this.wallTextures[wallIndex];
        const tempC = document.createElement('canvas');
        tempC.width = wallData.width; tempC.height = wallData.height;
        tempC.getContext('2d').putImageData(wallData, 0, 0);
        
        const physW = tempC.width / 30 * 10;
        const physH = tempC.height / 30 * 10;
        const offsetX = (wPX - physW * scalePX) / 2;
        const offsetY = (hPX - physH * scalePX) / 2;
        
        ctx.drawImage(tempC, offsetX, offsetY, physW * scalePX, physH * scalePX);
        
        ctx.strokeStyle = '#2b2d42'; ctx.lineWidth = 1 * scalePX; ctx.setLineDash([5*scalePX, 5*scalePX]);
        ctx.strokeRect(offsetX, offsetY, physW * scalePX, physH * scalePX);
        ctx.setLineDash([]);
        
        ctx.fillStyle = '#d90429'; ctx.font = `bold ${12 * dpi/72}px Arial`; ctx.textAlign = 'center';
        const names = ['上边墙', '左边墙', '下边墙', '右边墙'];
        ctx.fillText(`↑ 这一边靠近盒子的顶部大开口/盖子处 (${names[wallIndex]}) ↑`, wPX/2, offsetY - 5 * scalePX);
        
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, widthMM, heightMM);
    }
    
    updateSteps(step) {
        document.querySelectorAll('.step').forEach((s, i) => {
            i + 1 <= step ? s.classList.add('active') : s.classList.remove('active');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => { window.shadowCutter = new FourWallShadowCutter(); });