/* 四壁光影模板生成器 - i18n 双语支持版 */

class FourWallShadowCutter {
    constructor() {
        this.originalImage = null;
        this.binaryImageData = null;
        this.wallTextures = []; // 0:上, 1:左, 2:下, 3:右
        this.baseTexture = null; 
        
        this.isFirstLoad = true;
        this.shouldInvert = false;
        this.isCalculating = false;
        this.hasIslandWarning = false;
        
        this.tScene = null; this.tCamera = null; this.tRenderer = null;
        this.tBoxGroup = null; this.tLightSphere = null; this.tPlanes = [];
        this.tShadowBox = null; this.tActualShadow = null; this.tRaysGroup = null;
        this.tLabels = []; 
        
        // ======== i18n Dictionary ========
        this.currentLang = 'zh'; // Default
        this.i18n = {
            zh: {
                app_title: "光影纸盒图纸生成器",
                app_subtitle: "上传图案并输入盒子尺寸，一键生成裁切图纸。",
                donate_text: "觉得好用？请作者喝杯咖啡 ☕",
                wechat: "微信", alipay: "支付宝",
                step_1: "1. 传图与设置", step_2: "2. 光影预览", step_3: "3. 下载打印",
                upload_text: "点击/拖放换图",
                preview_orig: "① 原图", preview_bin: "② 提取影子(黑块)",
                lbl_threshold: "图案细节过滤", lbl_box_w: "纸盒长度 (X) cm", lbl_box_h: "纸盒宽度 (Y) cm", lbl_box_d: "纸盒深度 (Z) cm",
                lbl_light_h: "灯泡离底高度 cm", lbl_light_x: "灯泡 X轴 偏移 cm", lbl_light_y: "灯泡 Y轴 偏移 cm",
                lbl_shadow_h: "投影墙面高度 cm", lbl_shadow_desc: "(决定最终投射在墙上的图案大小)",
                lbl_invert: "光影设定", lbl_invert_auto: "自动", btn_invert: "反转黑白",
                btn_generate: "生成预览与图纸",
                title_preview: "效果预览", desc_preview: "调节左侧数值，右侧即时响应。鼠标左键可旋转，滚轮可缩放。",
                title_print: "打印图纸输出",
                warn_title: "提示：侧壁图案中有悬空部分！", warn_desc: "图纸上红色的部分在剪裁时会完全掉落。建议反转黑白，或在剪纸时手工留点纸条连着。",
                thumb_base: "盒子底面", thumb_top: "上边墙", thumb_left: "左边墙", thumb_bot: "下边墙", thumb_right: "右边墙",
                btn_pdf: "下载 PDF 打印图纸",
                // JS specific keys
                loader_text: "正在生成图纸...", loader_pdf: "正在拼装 A4 图纸...",
                alert_no_img: "请先上传图片！", alert_no_pdf: "请先生成图纸！",
                status_inverted: "已反转", status_default: "默认",
                modal_t_base: "盒子底面图案图纸", modal_t_top: "上边墙裁切图纸", modal_t_left: "左边墙裁切图纸", modal_t_bot: "下边墙裁切图纸", modal_t_right: "右边墙裁切图纸",
                pdf_title: "光影纸盒裁切图纸", pdf_cut_inst: "【 剪裁说明 】", pdf_grey: "1. 【灰色区域】：保留纸板，不要剪。", pdf_white: "2. 【白色区域】：用刻刀全部掏空，让光透出去。",
                pdf_red_1: "3. 【红色区域】：提示！这是侧壁悬空的图案，全剪会掉下来。", pdf_red_2: "   剪的时候必须留一条纸连着，或者用透明胶带从背面固定！",
                pdf_print_warn: "⚠️ 打印属性提示：", pdf_print_1: "本PDF包含 6 页（封面 + 1张底面 + 4张侧墙）。", pdf_print_2: "本图纸已严格按 1:1 比例生成。打印时请务必在打印机设置中", pdf_print_3: "选择【实际大小】或【100% 缩放】。绝不要选择“适应纸张”！",
                pdf_watermark: "如果这个工具帮到了您，欢迎回到网页端打赏支持作者！", pdf_base_desc: "↑ 盒子底面图案 (可垫在盒子下方或贴于外部) ↑", pdf_wall_desc: "↑ 这一边靠近盒子的顶部大开口/盖子处 ({0}) ↑",
                label_top: "上", label_left: "左", label_bot: "下", label_right: "右"
            },
            en: {
                app_title: "Shadow Box Template Generator",
                app_subtitle: "Upload an image & input dimensions to generate 1:1 cut templates.",
                donate_text: "Find this useful? Buy me a coffee ☕",
                wechat: "WeChat", alipay: "Alipay",
                step_1: "1. Upload & Setup", step_2: "2. 3D Preview", step_3: "3. Download PDF",
                upload_text: "Click/Drag to Upload",
                preview_orig: "① Original", preview_bin: "② Extracted Shadow",
                lbl_threshold: "Detail Threshold", lbl_box_w: "Box Length (X) cm", lbl_box_h: "Box Width (Y) cm", lbl_box_d: "Box Depth (Z) cm",
                lbl_light_h: "Light Height cm", lbl_light_x: "Light X-Offset cm", lbl_light_y: "Light Y-Offset cm",
                lbl_shadow_h: "Projection Wall Height cm", lbl_shadow_desc: "(Determines final pattern size on wall)",
                lbl_invert: "Light/Shadow", lbl_invert_auto: "Auto", btn_invert: "Invert B/W",
                btn_generate: "Generate Preview & Templates",
                title_preview: "3D Preview", desc_preview: "Adjust sliders to see real-time changes. Left-click to rotate, scroll to zoom.",
                title_print: "Printable Templates",
                warn_title: "Warning: Floating 'Islands' Detected!", warn_desc: "Red areas will fall out when cut. Try inverting B/W, or manually leave connecting paper tabs.",
                thumb_base: "Base Pattern", thumb_top: "Top Wall", thumb_left: "Left Wall", thumb_bot: "Bottom Wall", thumb_right: "Right Wall",
                btn_pdf: "Download PDF Templates",
                // JS specific keys
                loader_text: "Generating templates...", loader_pdf: "Assembling A4 PDF...",
                alert_no_img: "Please upload an image first!", alert_no_pdf: "Please generate templates first!",
                status_inverted: "Inverted", status_default: "Default",
                modal_t_base: "Base Pattern Template", modal_t_top: "Top Wall Template", modal_t_left: "Left Wall Template", modal_t_bot: "Bottom Wall Template", modal_t_right: "Right Wall Template",
                pdf_title: "Shadow Box Cut Templates", pdf_cut_inst: "[ Cutting Instructions ]", pdf_grey: "1. [GREY AREA]: Keep this cardboard intact.", pdf_white: "2. [WHITE AREA]: Cut out completely to let light pass.",
                pdf_red_1: "3. [RED AREA]: Warning! Floating islands detected. Will fall out.", pdf_red_2: "   Leave connecting tabs or tape them from behind!",
                pdf_print_warn: "⚠️ Print Settings Warning:", pdf_print_1: "This PDF contains 6 pages (Cover + 1 Base + 4 Walls).", pdf_print_2: "Templates are strictly 1:1 scale. In your printer settings,", pdf_print_3: "choose 'Actual Size' or '100% Scale'. NEVER 'Fit to Page'!",
                pdf_watermark: "If this tool helped you, consider supporting the author on the website!", pdf_base_desc: "↑ Base Pattern (Place under box or stick outside) ↑", pdf_wall_desc: "↑ This edge faces the top opening of the box ({0}) ↑",
                label_top: "Top", label_left: "Left", label_bot: "Bot", label_right: "Right"
            }
        };

        this.initUI();
        this.loadDefaultImage(); 
    }
    
    t(key) { return this.i18n[this.currentLang][key]; }

    toggleLanguage() {
        this.currentLang = this.currentLang === 'zh' ? 'en' : 'zh';
        const btn = document.getElementById('lang-toggle-btn');
        btn.innerHTML = `<i class="fas fa-language"></i> ${this.currentLang === 'zh' ? 'EN' : '中文'}`;
        
        // Update static HTML texts
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            if(this.i18n[this.currentLang][key]) {
                el.innerText = this.i18n[this.currentLang][key];
            }
        });
        
        // Update dynamic states
        document.getElementById('auto-invert-value').textContent = this.shouldInvert ? this.t('status_inverted') : this.t('status_default');
        
        // Update 3D Labels
        if(this.tLabels.length > 0) {
            const labels = [this.t('label_top'), this.t('label_left'), this.t('label_bot'), this.t('label_right')];
            for (let i = 0; i < 4; i++) {
                const newSprite = this.createTextSprite(labels[i]);
                this.tLabels[i].material.map = newSprite.material.map;
                this.tLabels[i].material.needsUpdate = true;
            }
        }
    }

    initUI() {
        document.getElementById('lang-toggle-btn').addEventListener('click', () => this.toggleLanguage());

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
            document.getElementById('auto-invert-value').textContent = this.shouldInvert ? this.t('status_inverted') : this.t('status_default');
            if (this.originalImage) {
                this.isFirstLoad = false;
                this.processImage();
            }
        });
        
        document.getElementById('process-btn').addEventListener('click', () => this.startCalculation());
        document.getElementById('download-pdf-btn').addEventListener('click', () => this.generatePDF());
        
        this.bindThumbnailClicks();
        this.updateLightLimits(); 
        this.updateSteps(1);
        this.initThreeJS();
    }

    bindThumbnailClicks() {
        const thumbBtnIds = ['thumb-btn-base', 'thumb-btn-top', 'thumb-btn-left', 'thumb-btn-bottom', 'thumb-btn-right'];
        const titleKeys = ['modal_t_base', 'modal_t_top', 'modal_t_left', 'modal_t_bot', 'modal_t_right'];
        
        thumbBtnIds.forEach((btnId, idx) => {
            const btn = document.getElementById(btnId);
            btn.addEventListener('click', () => {
                let textureData = idx === 0 ? this.baseTexture : this.wallTextures[idx - 1];
                if (!textureData) return;
                this.openModal(this.t(titleKeys[idx]), textureData);
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
                    this.startCalculation(); 
                });
            });
        };
        img.onerror = () => {
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

        const labels = [this.t('label_top'), this.t('label_left'), this.t('label_bot'), this.t('label_right')];
        for (let i = 0; i < 4; i++) {
            const sprite = this.createTextSprite(labels[i]);
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
            if(container.clientWidth === 0) return;
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

    showLoader(textKey, showProgress = false) {
        document.getElementById('loader-text').textContent = this.t(textKey);
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
        document.getElementById('auto-invert-value').textContent = this.shouldInvert ? this.t('status_inverted') : this.t('status_default');
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
        if (!this.binaryImageData) { alert(this.t('alert_no_img')); return; }
        
        this.isCalculating = true;
        this.hasIslandWarning = false;
        document.getElementById('island-warning').style.display = 'none';
        
        this.updateSteps(3);
        this.updateLoaderProgress(0);
        this.showLoader('loader_text', true);
        
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
                    
                    let color = 255; 
                    if (imgPx >= 0 && imgPx < imgW && imgPy >= 0 && imgPy < imgH) {
                        const idx = (imgPy * imgW + imgPx) * 4;
                        if (binData[idx] === 0) color = 220; 
                    }
                    
                    const dIdx = (r * wBasePx + c) * 4;
                    baseImg.data[dIdx] = color;
                    baseImg.data[dIdx+1] = color;
                    baseImg.data[dIdx+2] = color;
                    baseImg.data[dIdx+3] = 255;
                }
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
        if (this.wallTextures.length === 0 || !this.baseTexture) { alert(this.t('alert_no_pdf')); return; }
        this.showLoader('loader_pdf');
        
        try {
            const { jsPDF } = window.jspdf;
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
            
            this.drawCoverCanvasForPDF(pdf);
            
            pdf.addPage('a4', 'portrait');
            this.drawBaseCanvasForPDF(pdf);
            
            const orientMap = ['landscape', 'portrait', 'landscape', 'portrait'];
            for (let i = 0; i < 4; i++) {
                pdf.addPage('a4', orientMap[i]);
                this.drawWallCanvasForPDF(pdf, i, orientMap[i]);
            }
            
            pdf.save(`ShadowBox_Templates_${new Date().getTime()}.pdf`);
        } catch (error) {
            alert('PDF Export Failed: ' + error.message);
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
        ctx.fillText(this.t('pdf_title'), 25 * dpi/25.4, 40 * dpi/25.4);
        
        ctx.fillStyle = '#333'; ctx.font = `${14 * dpi/72}px Arial`;
        let y = 70 * dpi/25.4;
        const txt = (str, color='#333') => { ctx.fillStyle = color; ctx.fillText(str, 25 * dpi/25.4, y); y += 12 * dpi/25.4; };
        
        txt(`X: ${document.getElementById('box-width').value} cm`);
        txt(`Y: ${document.getElementById('box-height').value} cm`);
        txt(`Z: ${document.getElementById('box-depth').value} cm`);
        txt(`${this.t('lbl_light_h')}: ${document.getElementById('light-height').value} cm`);
        const lx = document.getElementById('light-x').value;
        const ly = document.getElementById('light-y').value;
        txt(`X Offset: ${lx} cm, Y Offset: ${ly} cm`);
        
        y += 15 * dpi/25.4;
        txt(this.t('pdf_cut_inst'), '#ef233c');
        txt(this.t('pdf_grey'));
        txt(this.t('pdf_white'));
        if (this.hasIslandWarning) {
            txt(this.t('pdf_red_1'), '#ef233c');
            txt(this.t('pdf_red_2'), '#ef233c');
        }
        
        y += 20 * dpi/25.4;
        txt(this.t('pdf_print_warn'), '#4361ee');
        txt(this.t('pdf_print_1'), '#333');
        txt(this.t('pdf_print_2'), '#333');
        txt(this.t('pdf_print_3'), '#333');

        y = hPX - 35 * dpi/25.4;
        ctx.fillStyle = '#888888';
        ctx.font = `italic ${10 * dpi/72}px Arial`;
        ctx.textAlign = 'center';
        ctx.fillText('Powered by SolidSteam\'s ShadowArt Tool', wPX/2, y);
        ctx.fillText(this.t('pdf_watermark'), wPX/2, y + 6 * dpi/25.4);
        ctx.fillText('GitHub: https://github.com/solidsteam/shadowArt', wPX/2, y + 12 * dpi/25.4);
        
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.9), 'JPEG', 0, 0, 210, 297);
    }

    drawBaseCanvasForPDF(pdf) {
        const canvas = document.getElementById('pdf-base-canvas');
        const ctx = canvas.getContext('2d');
        const dpi = 150, scalePX = dpi / 25.4;
        const widthMM = 210, heightMM = 297; 
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
        ctx.fillText(this.t('pdf_base_desc'), wPX/2, offsetY - 5 * scalePX);

        ctx.fillStyle = '#999999'; ctx.font = `italic ${9 * dpi/72}px Arial`;
        ctx.fillText(`Powered by SolidSteam's ShadowArt Tool | ${this.t('pdf_watermark')}`, wPX/2, hPX - 10 * scalePX);
        
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
        const names = [this.t('thumb_top'), this.t('thumb_left'), this.t('thumb_bot'), this.t('thumb_right')];
        let descStr = this.t('pdf_wall_desc').replace('{0}', names[wallIndex]);
        ctx.fillText(descStr, wPX/2, offsetY - 5 * scalePX);

        ctx.fillStyle = '#999999'; ctx.font = `italic ${9 * dpi/72}px Arial`;
        ctx.fillText(`Powered by SolidSteam's ShadowArt Tool | ${this.t('pdf_watermark')}`, wPX/2, hPX - 10 * scalePX);
        
        pdf.addImage(canvas.toDataURL('image/jpeg', 0.85), 'JPEG', 0, 0, widthMM, heightMM);
    }
    
    updateSteps(step) {
        document.querySelectorAll('.step').forEach((s, i) => {
            i + 1 <= step ? s.classList.add('active') : s.classList.remove('active');
        });
    }
}

document.addEventListener('DOMContentLoaded', () => { window.shadowCutter = new FourWallShadowCutter(); });