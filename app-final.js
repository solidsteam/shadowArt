/* 四壁光影投影剪裁模板生成器 - 重构版（2026）
   包含：GeoGebra 3D预览、极坐标平滑算法、Canvas转PDF避免乱码、动态纸张尺寸 */

class FourWallShadowCutter {
    constructor() {
        // 状态变量
        this.imageData = null;
        this.originalImage = null;
        this.binaryImageData = null;
        this.contourPoints = [];
        this.smoothedPolarPoints = []; // 极坐标平滑后的轮廓点
        this.sampledPoints = [];
        this.cuttingCurves = [[], [], [], []]; // 0:上, 1:左, 2:下, 3:右
        this.zoomLevel = 1.0;
        this.autoInvert = true;
        this.shouldInvert = false;
        this.lidRecommendation = "等待计算...";
        
        // GeoGebra 3D应用实例
        this.ggbApplet = null;
        this.geogebraLoaded = false;
        
        // 纸张规格定义（单位：mm）
        this.paperSizes = {
            'A4': { width: 210, height: 297 },
            'A3': { width: 297, height: 420 },
            'A2': { width: 420, height: 594 },
            'A1': { width: 594, height: 841 },
            'A0': { width: 841, height: 1189 }
        };
        
        this.selectedPaperSizes = ['A4', 'A4', 'A4', 'A4']; // 各页面纸张
        this.selectedPaperOrientations = ['portrait', 'portrait', 'portrait', 'portrait']; // 各页面方向
        
        // 初始化UI
        this.initUI();
    }
    
    initUI() {
        // 文件上传
        const uploadArea = document.getElementById('upload-area');
        const fileInput = document.getElementById('file-input');
        
        uploadArea.addEventListener('click', () => fileInput.click());
        
        uploadArea.addEventListener('dragover', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#4361ee';
            uploadArea.style.background = 'rgba(67, 97, 238, 0.1)';
        });
        
        uploadArea.addEventListener('dragleave', () => {
            uploadArea.style.borderColor = '#ddd';
            uploadArea.style.background = 'transparent';
        });
        
        uploadArea.addEventListener('drop', (e) => {
            e.preventDefault();
            uploadArea.style.borderColor = '#ddd';
            uploadArea.style.background = 'transparent';
            
            if (e.dataTransfer.files.length > 0) {
                this.loadImage(e.dataTransfer.files[0]);
            }
        });
        
        fileInput.addEventListener('change', (e) => {
            if (e.target.files.length > 0) {
                this.loadImage(e.target.files[0]);
            }
        });
        
        // 滑块控制
        const threshold = document.getElementById('threshold');
        const thresholdValue = document.getElementById('threshold-value');
        threshold.addEventListener('input', () => {
            thresholdValue.textContent = threshold.value;
            if (this.originalImage) {
                this.processImage();
            }
        });
        
        const smoothness = document.getElementById('smoothness');
        const smoothnessValue = document.getElementById('smoothness-value');
        smoothness.addEventListener('input', () => {
            smoothnessValue.textContent = smoothness.value;
            if (this.originalImage) {
                this.processImage();
            }
        });
        
        const boxWidth = document.getElementById('box-width');
        const boxWidthValue = document.getElementById('box-width-value');
        boxWidth.addEventListener('input', () => {
            boxWidthValue.textContent = boxWidth.value;
            this.updateParamDisplay();
        });
        
        const boxHeight = document.getElementById('box-height');
        const boxHeightValue = document.getElementById('box-height-value');
        boxHeight.addEventListener('input', () => {
            boxHeightValue.textContent = boxHeight.value;
            this.updateParamDisplay();
        });
        
        const boxDepth = document.getElementById('box-depth');
        const boxDepthValue = document.getElementById('box-depth-value');
        boxDepth.addEventListener('input', () => {
            boxDepthValue.textContent = boxDepth.value;
            this.updateParamDisplay();
        });
        
        const lightHeight = document.getElementById('light-height');
        const lightHeightValue = document.getElementById('light-height-value');
        lightHeight.addEventListener('input', () => {
            lightHeightValue.textContent = lightHeight.value;
            this.updateParamDisplay();
        });
        
        const shadowWidth = document.getElementById('shadow-width');
        const shadowWidthValue = document.getElementById('shadow-width-value');
        shadowWidth.addEventListener('input', () => {
            shadowWidthValue.textContent = shadowWidth.value;
            this.updateParamDisplay();
        });
        
        const sampleCount = document.getElementById('sample-count');
        const sampleCountValue = document.getElementById('sample-count-value');
        sampleCount.addEventListener('input', () => {
            sampleCountValue.textContent = sampleCount.value;
            this.updateParamDisplay();
        });
        
        // 反转按钮
        document.getElementById('toggle-invert').addEventListener('click', () => {
            this.shouldInvert = !this.shouldInvert;
            document.getElementById('auto-invert-value').textContent = this.shouldInvert ? '是' : '否';
            if (this.originalImage) {
                this.processImage();
            }
        });
        
        // 其他按钮
        document.getElementById('reset-btn').addEventListener('click', () => this.reset());
        document.getElementById('process-btn').addEventListener('click', () => this.calculateCuttingCurves());
        document.getElementById('download-pdf-btn').addEventListener('click', () => this.generatePDF());
        document.getElementById('print-btn').addEventListener('click', () => this.printTemplates());
        
        // 初始状态
        this.updateSteps(1);
        this.updateParamDisplay();
        
        // 初始化GeoGebra 3D（延迟加载）
        setTimeout(() => this.initGeogebra(), 500);
    }
    
    // 初始化GeoGebra 3D
    initGeogebra() {
        if (!window.GGBApplet) {
            console.warn('GeoGebra脚本尚未加载');
            return;
        }
        
        try {
            const parameters = {
                "appName": "3d",
                "width": 800,
                "height": 400,
                "showToolBar": false,
                "showAlgebraInput": false,
                "showMenuBar": false,
                "showResetIcon": true,
                "enableLabelDrags": false,
                "enableShiftDragZoom": true,
                "enableRightClick": false,
                "capturingThreshold": null,
                "showToolBarHelp": false,
                "errorDialogsActive": false,
                "useBrowserForJS": false,
                "allowStyleBar": false,
                "preventFocus": false,
                "language": "zh",
                "borderColor": "#ffffff"
            };
            
            this.ggbApplet = new GGBApplet(parameters, true);
            this.ggbApplet.inject('ggb-container');
            this.geogebraLoaded = true;
            
            console.log('GeoGebra 3D初始化成功');
        } catch (error) {
            console.error('GeoGebra初始化失败:', error);
        }
    }
    
    // 在3D视图中绘制几何元素
    updateGeogebra3D() {
        if (!this.geogebraLoaded || !this.ggbApplet || this.cuttingCurves.flat().length === 0) {
            return;
        }
        
        try {
            // 清除之前的图形
            this.ggbApplet.evalCommand('DeleteAllObjects[]');
            
            // 获取参数
            const boxWidth = parseFloat(document.getElementById('box-width').value);
            const boxHeight = parseFloat(document.getElementById('box-height').value);
            const boxDepth = parseFloat(document.getElementById('box-depth').value);
            const lightHeight = parseFloat(document.getElementById('light-height').value);
            
            // 1. 绘制光源点 (0, 0, lightHeight)
            this.ggbApplet.evalCommand(`LightSource = Point({0, 0, ${lightHeight}})`);
            this.ggbApplet.evalCommand('SetColor(LightSource, "blue")');
            this.ggbApplet.evalCommand('SetPointSize(LightSource, 5)');
            
            // 2. 绘制盒子框架
            const halfWidth = boxWidth / 2;
            const halfHeight = boxHeight / 2;
            
            // 底部矩形
            this.ggbApplet.evalCommand(`BottomRect = Polygon({${-halfWidth}, ${halfHeight}, 0}, {${halfWidth}, ${halfHeight}, 0}, {${halfWidth}, ${-halfHeight}, 0}, {${-halfWidth}, ${-halfHeight}, 0})`);
            this.ggbApplet.evalCommand('SetColor(BottomRect, "gray")');
            this.ggbApplet.evalCommand('SetLineThickness(BottomRect, 1)');
            
            // 四面墙
            this.ggbApplet.evalCommand(`TopWall = Polygon({${-halfWidth}, ${halfHeight}, 0}, {${halfWidth}, ${halfHeight}, 0}, {${halfWidth}, ${halfHeight}, ${boxDepth}}, {${-halfWidth}, ${halfHeight}, ${boxDepth}})`);
            this.ggbApplet.evalCommand(`LeftWall = Polygon({${-halfWidth}, ${halfHeight}, 0}, {${-halfWidth}, ${-halfHeight}, 0}, {${-halfWidth}, ${-halfHeight}, ${boxDepth}}, {${-halfWidth}, ${halfHeight}, ${boxDepth}})`);
            this.ggbApplet.evalCommand(`BottomWall = Polygon({${-halfWidth}, ${-halfHeight}, 0}, {${halfWidth}, ${-halfHeight}, 0}, {${halfWidth}, ${-halfHeight}, ${boxDepth}}, {${-halfWidth}, ${-halfHeight}, ${boxDepth}})`);
            this.ggbApplet.evalCommand(`RightWall = Polygon({${halfWidth}, ${halfHeight}, 0}, {${halfWidth}, ${-halfHeight}, 0}, {${halfWidth}, ${-halfHeight}, ${boxDepth}}, {${halfWidth}, ${halfHeight}, ${boxDepth}})`);
            
            // 设置墙面颜色（半透明）
            this.ggbApplet.evalCommand('SetColor(TopWall, 255, 0, 0, 0.2)');
            this.ggbApplet.evalCommand('SetColor(LeftWall, 0, 255, 0, 0.2)');
            this.ggbApplet.evalCommand('SetColor(BottomWall, 0, 0, 255, 0.2)');
            this.ggbApplet.evalCommand('SetColor(RightWall, 255, 165, 0, 0.2)');
            
            // 3. 绘制投影轮廓线（底面）
            if (this.sampledPoints.length > 1) {
                let contourCommands = '';
                for (let i = 0; i < this.sampledPoints.length; i++) {
                    const p = this.sampledPoints[i];
                    const normalizedX = (p.x / this.binaryImageData.width - 0.5) * 2;
                    const normalizedY = (p.y / this.binaryImageData.height - 0.5) * 2;
                    
                    // 缩放到底面
                    const shadowWidth = parseFloat(document.getElementById('shadow-width').value);
                    const currentWidth = 2; // 归一化后的宽度
                    const scale = shadowWidth / currentWidth;
                    
                    const x = normalizedX * scale / 2; // 缩小显示
                    const y = normalizedY * scale / 2;
                    
                    if (i === 0) {
                        contourCommands += `MoveTo({${x}, ${y}, 0})`;
                    } else {
                        contourCommands += `LineTo({${x}, ${y}, 0})`;
                    }
                }
                // 闭合曲线
                const firstP = this.sampledPoints[0];
                const firstX = (firstP.x / this.binaryImageData.width - 0.5) * 2;
                const firstY = (firstP.y / this.binaryImageData.height - 0.5) * 2;
                const firstScale = shadowWidth / 2;
                contourCommands += `LineTo({${firstX * firstScale / 2}, ${firstY * firstScale / 2}, 0})`;
                
                this.ggbApplet.evalCommand(`Contour = Curve(${contourCommands})`);
                this.ggbApplet.evalCommand('SetColor(Contour, "red")');
                this.ggbApplet.evalCommand('SetLineThickness(Contour, 3)');
            }
            
            // 4. 绘制剪裁曲线（四面墙）
            const colors = ['red', 'green', 'blue', 'orange'];
            for (let side = 0; side < 4; side++) {
                const curve = this.cuttingCurves[side];
                if (curve.length > 1) {
                    let curveCommands = '';
                    for (let i = 0; i < curve.length; i++) {
                        const point = curve[i];
                        let x, y, z;
                        
                        // 转换为实际坐标
                        switch (side) {
                            case 0: // 上墙
                                x = point.x;
                                y = halfHeight;
                                z = point.z;
                                break;
                            case 1: // 左墙
                                x = -halfWidth;
                                y = point.y;
                                z = point.z;
                                break;
                            case 2: // 下墙
                                x = point.x;
                                y = -halfHeight;
                                z = point.z;
                                break;
                            case 3: // 右墙
                                x = halfWidth;
                                y = point.y;
                                z = point.z;
                                break;
                        }
                        
                        // 缩放显示
                        const scale = 0.1; // 适当缩放
                        if (i === 0) {
                            curveCommands += `MoveTo({${x * scale}, ${y * scale}, ${z * scale}})`;
                        } else {
                            curveCommands += `LineTo({${x * scale}, ${y * scale}, ${z * scale}})`;
                        }
                    }
                    
                    if (curveCommands) {
                        this.ggbApplet.evalCommand(`WallCurve${side} = Curve(${curveCommands})`);
                        this.ggbApplet.evalCommand(`SetColor(WallCurve${side}, "${colors[side]}")`);
                        this.ggbApplet.evalCommand(`SetLineThickness(WallCurve${side}, 2)`);
                    }
                }
            }
            
            // 设置视图
            this.ggbApplet.evalCommand('SetViewDirection({30, 30, 30})');
            
        } catch (error) {
            console.error('GeoGebra 3D更新失败:', error);
        }
    }
    
    updateSteps(step) {
        document.querySelectorAll('.step').forEach((s, i) => {
            if (i + 1 <= step) {
                s.classList.add('active');
            } else {
                s.classList.remove('active');
            }
        });
    }
    
    updateParamDisplay() {
        // 更新滑块值显示
        document.getElementById('box-width-value').textContent = document.getElementById('box-width').value;
        document.getElementById('box-height-value').textContent = document.getElementById('box-height').value;
        document.getElementById('box-depth-value').textContent = document.getElementById('box-depth').value;
        document.getElementById('light-height-value').textContent = document.getElementById('light-height').value;
        document.getElementById('shadow-width-value').textContent = document.getElementById('shadow-width').value;
        document.getElementById('sample-count-value').textContent = document.getElementById('sample-count').value;
    }
    
    updateLidRecommendation(centerIsDark) {
        this.lidRecommendation = centerIsDark ? "建议封顶（需要顶盖）" : "建议不封顶（镂空/无顶盖）";
        const valueElement = document.getElementById('lid-recommendation-value');
        const textElement = document.getElementById('lid-recommendation-text');
        
        if (centerIsDark) {
            valueElement.textContent = "需要顶盖";
            valueElement.style.color = "#f8961e";
            textElement.textContent = "图像中心为暗色，投影时中心需要物理遮挡，建议为盒子加上顶盖。";
        } else {
            valueElement.textContent = "无需顶盖";
            valueElement.style.color = "#4cc9f0";
            textElement.textContent = "图像中心为亮色，投影时中心需要透光，建议盒子顶部镂空。";
        }
    }
    
    loadImage(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                this.updateSteps(2);
                this.processImage();
            };
            img.src = e.target.result;
        };
        reader.readAsDataURL(file);
    }
    
    processImage() {
        if (!this.originalImage) return;
        
        const loading = document.getElementById('loading');
        loading.style.display = 'block';
        
        // 延迟处理以避免UI阻塞
        setTimeout(() => {
            // 处理原始图像
            this.processOriginalImage();
            
            // 更新预览
            this.updatePreviews();
            
            loading.style.display = 'none';
            this.updateSteps(3);
            
            // 更新参数显示
            document.getElementById('param-image-size').textContent = 
                `${this.originalImage.width}×${this.originalImage.height}`;
        }, 100);
    }
    
    processOriginalImage() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置画布尺寸为原始图像尺寸
        canvas.width = this.originalImage.width;
        canvas.height = this.originalImage.height;
        
        // 绘制原始图像
        ctx.drawImage(this.originalImage, 0, 0);
        
        // 获取图像数据
        this.imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // 创建二值化副本
        this.binaryImageData = new ImageData(
            new Uint8ClampedArray(this.imageData.data),
            canvas.width,
            canvas.height
        );
        
        // 应用二值化
        this.applyThreshold();
        
        // 检查是否需要反转
        this.checkInvertNeeded();
        
        // 提取轮廓
        this.extractContour();
        
        // 极坐标平滑算法
        this.applyPolarSmoothing();
        
        // 采样轮廓点
        this.sampleContourPoints();
        
        // 检查中心区域颜色并更新盒盖建议
        this.checkCenterRegion();
    }
    
    applyThreshold() {
        const data = this.binaryImageData.data;
        const threshold = parseInt(document.getElementById('threshold').value);
        
        for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            
            // 转换为灰度值
            const gray = 0.299 * r + 0.587 * g + 0.114 * b;
            
            // 二值化
            const value = gray > threshold ? 255 : 0;
            
            data[i] = value;
            data[i + 1] = value;
            data[i + 2] = value;
        }
    }
    
    checkInvertNeeded() {
        if (!this.autoInvert) return;
        
        const data = this.binaryImageData.data;
        const width = this.binaryImageData.width;
        const height = this.binaryImageData.height;
        
        // 检查图像边缘像素是否为白色
        let edgeWhiteCount = 0;
        let edgeTotalCount = 0;
        
        // 检查四边
        for (let x = 0; x < width; x++) {
            const idxTop = (0 * width + x) * 4;
            const idxBottom = ((height - 1) * width + x) * 4;
            if (data[idxTop] === 255) edgeWhiteCount++;
            if (data[idxBottom] === 255) edgeWhiteCount++;
            edgeTotalCount += 2;
        }
        
        for (let y = 1; y < height - 1; y++) {
            const idxLeft = (y * width + 0) * 4;
            const idxRight = (y * width + (width - 1)) * 4;
            if (data[idxLeft] === 255) edgeWhiteCount++;
            if (data[idxRight] === 255) edgeWhiteCount++;
            edgeTotalCount += 2;
        }
        
        // 如果边缘像素大部分是黑色，则需要反转
        const whiteRatio = edgeWhiteCount / edgeTotalCount;
        this.shouldInvert = whiteRatio < 0.5;
        document.getElementById('auto-invert-value').textContent = this.shouldInvert ? '是' : '否';
        
        // 如果需要反转，则反转二值图像
        if (this.shouldInvert) {
            for (let i = 0; i < data.length; i += 4) {
                data[i] = 255 - data[i];
                data[i + 1] = 255 - data[i + 1];
                data[i + 2] = 255 - data[i + 2];
            }
        }
    }
    
    extractContour() {
        const width = this.binaryImageData.width;
        const height = this.binaryImageData.height;
        const data = this.binaryImageData.data;
        
        this.contourPoints = [];
        
        // 简单的轮廓提取算法：查找黑白边界
        for (let y = 1; y < height - 1; y++) {
            for (let x = 1; x < width - 1; x++) {
                const idx = (y * width + x) * 4;
                const current = data[idx];
                
                // 检查当前像素是否为黑色，且周围有白色像素
                if (current === 0) {
                    let hasWhiteNeighbor = false;
                    
                    // 检查4邻域
                    const neighbors = [
                        [x-1, y], [x+1, y], [x, y-1], [x, y+1]
                    ];
                    
                    for (const [nx, ny] of neighbors) {
                        const nIdx = (ny * width + nx) * 4;
                        if (data[nIdx] === 255) {
                            hasWhiteNeighbor = true;
                            break;
                        }
                    }
                    
                    if (hasWhiteNeighbor) {
                        this.contourPoints.push({ x, y });
                        
                        // 在图像上标记轮廓点（红色）
                        data[idx] = 255;
                        data[idx + 1] = 0;
                        data[idx + 2] = 0;
                    }
                }
            }
        }
    }
    
    // 极坐标平滑算法（废弃凸包）
    applyPolarSmoothing() {
        if (this.contourPoints.length < 3) {
            this.smoothedPolarPoints = [...this.contourPoints];
            return;
        }
        
        // 计算图像中心
        const centerX = this.binaryImageData.width / 2;
        const centerY = this.binaryImageData.height / 2;
        
        // 将轮廓点转换为极坐标（角度, 半径）
        const polarPoints = this.contourPoints.map(p => {
            const dx = p.x - centerX;
            const dy = p.y - centerY;
            return {
                x: p.x,
                y: p.y,
                angle: Math.atan2(dy, dx), // -π 到 π
                radius: Math.sqrt(dx * dx + dy * dy)
            };
        });
        
        // 将角度转换为 0 到 2π
        for (const p of polarPoints) {
            if (p.angle < 0) p.angle += 2 * Math.PI;
        }
        
        // 按角度排序
        polarPoints.sort((a, b) => a.angle - b.angle);
        
        // 创建角度区间（1度一个区间）
        const angleBins = new Map();
        const angleStep = Math.PI / 180; // 1度
        
        // 对于每个角度区间，选择距离中心最远的点
        for (const point of polarPoints) {
            const binAngle = Math.round(point.angle / angleStep) * angleStep;
            
            if (!angleBins.has(binAngle) || point.radius > angleBins.get(binAngle).radius) {
                angleBins.set(binAngle, point);
            }
        }
        
        // 提取半径数组
        const sortedAngles = Array.from(angleBins.keys()).sort((a, b) => a - b);
        let radii = sortedAngles.map(angle => {
            const point = angleBins.get(angle);
            return point.radius;
        });
        
        // 应用高斯平滑滤波
        const smoothFactor = parseInt(document.getElementById('smoothness').value);
        if (smoothFactor > 1 && radii.length > 10) {
            radii = this.gaussianSmooth(radii, smoothFactor);
        }
        
        // 重建平滑后的极坐标点
        this.smoothedPolarPoints = [];
        for (let i = 0; i < sortedAngles.length; i++) {
            const angle = sortedAngles[i];
            const radius = radii[i];
            
            // 转换回笛卡尔坐标
            const x = centerX + Math.cos(angle) * radius;
            const y = centerY + Math.sin(angle) * radius;
            
            this.smoothedPolarPoints.push({ x, y });
        }
        
        // 确保闭合
        if (this.smoothedPolarPoints.length > 0) {
            const firstPoint = this.smoothedPolarPoints[0];
            this.smoothedPolarPoints.push({ x: firstPoint.x, y: firstPoint.y });
        }
    }
    
    // 高斯平滑滤波
    gaussianSmooth(data, sigma) {
        const kernelSize = Math.min(sigma * 3, Math.floor(data.length / 2));
        const kernel = this.createGaussianKernel(kernelSize, sigma);
        
        const result = new Array(data.length);
        
        for (let i = 0; i < data.length; i++) {
            let sum = 0;
            let weightSum = 0;
            
            for (let j = -kernelSize; j <= kernelSize; j++) {
                const idx = (i + j + data.length) % data.length;
                const weight = kernel[j + kernelSize];
                sum += data[idx] * weight;
                weightSum += weight;
            }
            
            result[i] = sum / weightSum;
        }
        
        return result;
    }
    
    createGaussianKernel(size, sigma) {
        const kernel = new Array(2 * size + 1);
        const sigma2 = 2 * sigma * sigma;
        const factor = 1 / (Math.sqrt(2 * Math.PI) * sigma);
        
        for (let i = -size; i <= size; i++) {
            kernel[i + size] = factor * Math.exp(-(i * i) / sigma2);
        }
        
        return kernel;
    }
    
    sampleContourPoints() {
        const sampleCount = parseInt(document.getElementById('sample-count').value);
        
        if (this.smoothedPolarPoints.length < 3) {
            this.sampledPoints = [...this.smoothedPolarPoints];
            return;
        }
        
        // 计算轮廓周长
        let perimeter = 0;
        const segmentLengths = [];
        
        for (let i = 0; i < this.smoothedPolarPoints.length - 1; i++) {
            const p1 = this.smoothedPolarPoints[i];
            const p2 = this.smoothedPolarPoints[i + 1];
            const dx = p2.x - p1.x;
            const dy = p2.y - p1.y;
            const length = Math.sqrt(dx * dx + dy * dy);
            segmentLengths.push(length);
            perimeter += length;
        }
        
        // 均匀采样
        this.sampledPoints = [];
        const pointsPerSegment = sampleCount / (this.smoothedPolarPoints.length - 1);
        
        for (let i = 0; i < this.smoothedPolarPoints.length - 1; i++) {
            const p1 = this.smoothedPolarPoints[i];
            const p2 = this.smoothedPolarPoints[i + 1];
            const segmentLength = segmentLengths[i];
            
            const pointsOnSegment = Math.max(1, Math.round(pointsPerSegment * segmentLength / perimeter * (this.smoothedPolarPoints.length - 1)));
            
            for (let j = 0; j < pointsOnSegment; j++) {
                const t = j / pointsOnSegment;
                this.sampledPoints.push({
                    x: p1.x + (p2.x - p1.x) * t,
                    y: p1.y + (p2.y - p1.y) * t
                });
            }
        }
        
        // 限制采样点数
        if (this.sampledPoints.length > sampleCount) {
            const step = this.sampledPoints.length / sampleCount;
            const sampled = [];
            for (let i = 0; i < sampleCount; i++) {
                sampled.push(this.sampledPoints[Math.floor(i * step)]);
            }
            this.sampledPoints = sampled;
        }
    }
    
    checkCenterRegion() {
        const data = this.binaryImageData.data;
        const width = this.binaryImageData.width;
        const height = this.binaryImageData.height;
        
        // 检查中心区域（占图像面积的1%）
        const centerX = Math.floor(width / 2);
        const centerY = Math.floor(height / 2);
        const radius = Math.floor(Math.min(width, height) * 0.05);
        
        let darkCount = 0;
        let totalCount = 0;
        
        for (let y = centerY - radius; y <= centerY + radius; y++) {
            for (let x = centerX - radius; x <= centerX + radius; x++) {
                if (x >= 0 && x < width && y >= 0 && y < height) {
                    const idx = (y * width + x) * 4;
                    if (data[idx] === 0) darkCount++;
                    totalCount++;
                }
            }
        }
        
        // 如果中心区域超过50%是黑色，则认为中心是暗色
        const centerIsDark = darkCount / totalCount > 0.5;
        this.updateLidRecommendation(centerIsDark);
    }
    
    calculateCuttingCurves() {
        if (this.sampledPoints.length === 0) {
            alert('请先上传并处理图像！');
            return;
        }
        
        const loading = document.getElementById('loading');
        loading.style.display = 'block';
        
        setTimeout(() => {
            // 计算剪裁曲线
            this.computeWallCurves();
            
            // 计算推荐纸张尺寸
            this.calculatePaperSizes();
            
            // 绘制模板缩略图
            this.drawTemplateThumbnails();
            
            // 更新GeoGebra 3D视图
            this.updateGeogebra3D();
            
            loading.style.display = 'none';
            this.updateSteps(4);
            
            // 更新参数显示
            document.getElementById('param-contour-points').textContent = this.contourPoints.length;
            document.getElementById('param-sample-points').textContent = this.sampledPoints.length;
        }, 100);
    }
    
    computeWallCurves() {
        // 清空之前的曲线
        this.cuttingCurves = [[], [], [], []];
        
        // 获取参数
        const boxWidth = parseFloat(document.getElementById('box-width').value) * 10; // cm to mm
        const boxHeight = parseFloat(document.getElementById('box-height').value) * 10;
        const boxDepth = parseFloat(document.getElementById('box-depth').value) * 10;
        const lightHeight = parseFloat(document.getElementById('light-height').value) * 10;
        const shadowWidth = parseFloat(document.getElementById('shadow-width').value) * 10;
        
        // 归一化采样点坐标到[-1, 1]范围
        const normalizedPoints = this.sampledPoints.map(p => ({
            x: (p.x / this.binaryImageData.width - 0.5) * 2,
            y: (p.y / this.binaryImageData.height - 0.5) * 2
        }));
        
        // 计算包围盒
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        for (const p of normalizedPoints) {
            if (p.x < minX) minX = p.x;
            if (p.x > maxX) maxX = p.x;
            if (p.y < minY) minY = p.y;
            if (p.y > maxY) maxY = p.y;
        }
        
        // 计算缩放因子
        const currentWidth = maxX - minX;
        const currentHeight = maxY - minY;
        const scale = shadowWidth / Math.max(currentWidth, currentHeight);
        
        // 缩放并中心化点
        const scaledPoints = normalizedPoints.map(p => ({
            x: p.x * scale,
            y: p.y * scale,
            z: 0
        }));
        
        // 使用实际盒子尺寸
        const halfWidth = boxWidth / 2;
        const halfHeight = boxHeight / 2;
        
        // 对每个点计算与四面墙的交点
        for (const point of scaledPoints) {
            const targetX = point.x;
            const targetY = point.y;
            
            for (let side = 0; side < 4; side++) {
                let intersectionX, intersectionY, intersectionZ;
                let isValid = false;
                
                switch (side) {
                    case 0: // 上墙：y = halfHeight
                        if (Math.abs(targetY) > 1e-6) {
                            const t = halfHeight / targetY;
                            if (t > 0) {
                                intersectionX = targetX * t;
                                intersectionZ = lightHeight * (1 - t);
                                intersectionY = halfHeight;
                                isValid = Math.abs(intersectionX) <= halfWidth && 
                                          intersectionZ >= 0 && 
                                          intersectionZ <= boxDepth;
                            }
                        }
                        break;
                        
                    case 1: // 左墙：x = -halfWidth
                        if (Math.abs(targetX) > 1e-6) {
                            const t = -halfWidth / targetX;
                            if (t > 0) {
                                intersectionY = targetY * t;
                                intersectionZ = lightHeight * (1 - t);
                                intersectionX = -halfWidth;
                                isValid = Math.abs(intersectionY) <= halfHeight && 
                                          intersectionZ >= 0 && 
                                          intersectionZ <= boxDepth;
                            }
                        }
                        break;
                        
                    case 2: // 下墙：y = -halfHeight
                        if (Math.abs(targetY) > 1e-6) {
                            const t = -halfHeight / targetY;
                            if (t > 0) {
                                intersectionX = targetX * t;
                                intersectionZ = lightHeight * (1 - t);
                                intersectionY = -halfHeight;
                                isValid = Math.abs(intersectionX) <= halfWidth && 
                                          intersectionZ >= 0 && 
                                          intersectionZ <= boxDepth;
                            }
                        }
                        break;
                        
                    case 3: // 右墙：x = halfWidth
                        if (Math.abs(targetX) > 1e-6) {
                            const t = halfWidth / targetX;
                            if (t > 0) {
                                intersectionY = targetY * t;
                                intersectionZ = lightHeight * (1 - t);
                                intersectionX = halfWidth;
                                isValid = Math.abs(intersectionY) <= halfHeight && 
                                          intersectionZ >= 0 && 
                                          intersectionZ <= boxDepth;
                            }
                        }
                        break;
                }
                
                if (isValid) {
                    // 确保高度在0到盒子深度之间
                    intersectionZ = Math.max(0, Math.min(intersectionZ, boxDepth));
                    
                    this.cuttingCurves[side].push({
                        x: intersectionX,
                        y: intersectionY,
                        z: intersectionZ
                    });
                }
            }
        }
        
        // 对每个墙面的点进行排序
        for (let side = 0; side < 4; side++) {
            if (this.cuttingCurves[side].length > 0) {
                switch (side) {
                    case 0: // 上墙：按x排序
                        this.cuttingCurves[side].sort((a, b) => a.x - b.x);
                        break;
                    case 1: // 左墙：按y排序（从上到下）
                        this.cuttingCurves[side].sort((a, b) => b.y - a.y);
                        break;
                    case 2: // 下墙：按x排序（反向）
                        this.cuttingCurves[side].sort((a, b) => b.x - a.x);
                        break;
                    case 3: // 右墙：按y排序（从下到上）
                        this.cuttingCurves[side].sort((a, b) => a.y - b.y);
                        break;
                }
            }
        }
    }
    
    // 计算推荐纸张尺寸
    calculatePaperSizes() {
        const boxWidth = parseFloat(document.getElementById('box-width').value) * 10; // mm
        const boxHeight = parseFloat(document.getElementById('box-height').value) * 10;
        const boxDepth = parseFloat(document.getElementById('box-depth').value) * 10;
        
        // 四面墙的尺寸（墙面积需要包含10mm边距）
        const wallSizes = [
            { width: boxWidth, height: boxDepth },   // 上墙
            { width: boxDepth, height: boxHeight },  // 左墙
            { width: boxWidth, height: boxDepth },   // 下墙
            { width: boxDepth, height: boxHeight }   // 右墙
        ];
        
        // 为每面墙选择最合适的纸张
        for (let i = 0; i < 4; i++) {
            const wall = wallSizes[i];
            const wallWidth = wall.width + 20; // 加10mm边距
            const wallHeight = wall.height + 20;
            
            let bestPaper = 'A4';
            let bestOrientation = 'portrait';
            let bestFit = Infinity;
            
            // 检查每种纸张
            for (const [paperName, paperSize] of Object.entries(this.paperSizes)) {
                // 检查纵向
                if (wallWidth <= paperSize.width && wallHeight <= paperSize.height) {
                    const fit = (paperSize.width - wallWidth) + (paperSize.height - wallHeight);
                    if (fit < bestFit) {
                        bestFit = fit;
                        bestPaper = paperName;
                        bestOrientation = 'portrait';
                    }
                }
                
                // 检查横向（交换宽高）
                if (wallWidth <= paperSize.height && wallHeight <= paperSize.width) {
                    const fit = (paperSize.height - wallWidth) + (paperSize.width - wallHeight);
                    if (fit < bestFit) {
                        bestFit = fit;
                        bestPaper = paperName;
                        bestOrientation = 'landscape';
                    }
                }
            }
            
            this.selectedPaperSizes[i] = bestPaper;
            this.selectedPaperOrientations[i] = bestOrientation;
        }
        
        // 更新显示
        const paperDisplay = document.getElementById('param-paper-size');
        const uniquePapers = [...new Set(this.selectedPaperSizes.map((size, idx) => 
            `${size} ${this.selectedPaperOrientations[idx]}`
        ))];
        paperDisplay.textContent = uniquePapers.join(', ');
    }
    
    updatePreviews() {
        // 更新原图预览
        this.drawPreview('preview-original', this.imageData);
        
        // 更新二值化预览
        this.drawPreview('preview-binary', this.binaryImageData);
        
        // 更新轮廓预览
        const contourData = new ImageData(
            new Uint8ClampedArray(this.binaryImageData.data),
            this.binaryImageData.width,
            this.binaryImageData.height
        );
        this.drawPreview('preview-contour', contourData);
        
        // 更新平滑轮廓预览
        this.drawSmoothedContourPreview();
    }
    
    drawPreview(canvasId, imageData) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 创建临时画布用于缩放
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = imageData.width;
        tempCanvas.height = imageData.height;
        const tempCtx = tempCanvas.getContext('2d');
        tempCtx.putImageData(imageData, 0, 0);
        
        // 缩放绘制
        ctx.drawImage(tempCanvas, 0, 0, canvas.width, canvas.height);
    }
    
    drawSmoothedContourPreview() {
        const canvas = document.getElementById('preview-smooth');
        const ctx = canvas.getContext('2d');
        
        // 清空画布
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        if (this.smoothedPolarPoints.length < 2) return;
        
        // 绘制平滑轮廓
        ctx.strokeStyle = '#00ff00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < this.smoothedPolarPoints.length; i++) {
            const p = this.smoothedPolarPoints[i];
            const x = (p.x / this.binaryImageData.width) * canvas.width;
            const y = (p.y / this.binaryImageData.height) * canvas.height;
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // 绘制采样点
        ctx.fillStyle = '#ff0000';
        for (const p of this.sampledPoints) {
            const x = (p.x / this.binaryImageData.width) * canvas.width;
            const y = (p.y / this.binaryImageData.height) * canvas.height;
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // 绘制中心点
        ctx.fillStyle = '#ffff00';
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawTemplateThumbnails() {
        // 绘制封面缩略图
        this.drawThumbnail('thumb-cover', 0);
        
        // 绘制四面墙缩略图
        for (let i = 0; i < 4; i++) {
            const canvasIds = ['thumb-top', 'thumb-left', 'thumb-bottom', 'thumb-right'];
            this.drawThumbnail(canvasIds[i], i);
        }
    }
    
    drawThumbnail(canvasId, wallIndex) {
        const canvas = document.getElementById(canvasId);
        const ctx = canvas.getContext('2d');
        const width = canvas.width;
        const height = canvas.height;
        
        // 清空画布
        ctx.clearRect(0, 0, width, height);
        
        if (wallIndex === -1) {
            // 封面页
            this.drawCoverThumbnail(ctx, width, height);
        } else {
            // 墙面模板
            this.drawWallThumbnail(ctx, width, height, wallIndex);
        }
    }
    
    drawCoverThumbnail(ctx, width, height) {
        // 背景
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, width, height);
        
        // 标题
        ctx.fillStyle = '#4361ee';
        ctx.font = 'bold 9px Arial';
        ctx.fillText('封面', 5, 15);
        
        // 简单图示
        ctx.strokeStyle = '#4361ee';
        ctx.lineWidth = 2;
        ctx.strokeRect(10, 25, width - 20, height - 40);
        
        ctx.fillStyle = '#666';
        ctx.font = '7px Arial';
        ctx.fillText('说明页', width/2 - 15, height/2);
    }
    
    drawWallThumbnail(ctx, width, height, wallIndex) {
        const sideNames = ['上墙', '左墙', '下墙', '右墙'];
        const colors = ['#ff4444', '#44ff44', '#4444ff', '#ffaa00'];
        
        // 背景
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, width, height);
        
        // 边框
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1;
        ctx.strokeRect(0, 0, width, height);
        
        // 标题
        ctx.fillStyle = colors[wallIndex];
        ctx.font = 'bold 8px Arial';
        ctx.fillText(sideNames[wallIndex], 5, 12);
        
        // 绘制剪裁曲线
        const curve = this.cuttingCurves[wallIndex];
        if (curve.length < 2) return;
        
        // 计算缩放和平移
        let minX = Infinity, maxX = -Infinity;
        let minZ = Infinity, maxZ = -Infinity;
        
        for (const point of curve) {
            let coord, heightVal;
            switch (wallIndex) {
                case 0: case 2: // 上墙、下墙：x坐标，z高度
                    coord = point.x;
                    heightVal = point.z;
                    break;
                case 1: case 3: // 左墙、右墙：y坐标，z高度
                    coord = point.y;
                    heightVal = point.z;
                    break;
            }
            
            if (coord < minX) minX = coord;
            if (coord > maxX) maxX = coord;
            if (heightVal < minZ) minZ = heightVal;
            if (heightVal > maxZ) maxZ = heightVal;
        }
        
        const rangeX = maxX - minX || 1;
        const rangeZ = maxZ - minZ || 1;
        
        // 绘制曲线
        ctx.strokeStyle = colors[wallIndex];
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        
        for (let i = 0; i < curve.length; i++) {
            const point = curve[i];
            let coord, heightVal;
            
            switch (wallIndex) {
                case 0: case 2:
                    coord = point.x;
                    heightVal = point.z;
                    break;
                case 1: case 3:
                    coord = point.y;
                    heightVal = point.z;
                    break;
            }
            
            const x = ((coord - minX) / rangeX) * (width - 10) + 5;
            const y = height - 5 - ((heightVal - minZ) / rangeZ) * (height - 10);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // 添加纸张标识
        const paperInfo = `${this.selectedPaperSizes[wallIndex]} ${this.selectedPaperOrientations[wallIndex] === 'landscape' ? '横' : '竖'}`;
        ctx.fillStyle = '#666';
        ctx.font = '6px Arial';
        ctx.fillText(paperInfo, 5, height - 5);
    }
    
    async generatePDF() {
        if (this.cuttingCurves.flat().length === 0) {
            alert('请先计算剪裁曲线！');
            return;
        }
        
        const loading = document.getElementById('loading');
        loading.style.display = 'block';
        
        try {
            // 动态导入jsPDF
            const { jsPDF } = window.jspdf;
            
            // 创建PDF文档（使用第一面墙的纸张方向）
            const firstOrientation = this.selectedPaperOrientations[0];
            const pdf = new jsPDF({
                orientation: firstOrientation,
                unit: 'mm',
                format: this.selectedPaperSizes[0].toLowerCase()
            });
            
            // 第1页：封面
            await this.addCoverPageCanvas(pdf);
            
            // 第2-5页：四面墙模板
            for (let i = 0; i < 4; i++) {
                if (i > 0) {
                    // 添加新页面，使用对应墙面的纸张设置
                    const orientation = this.selectedPaperOrientations[i];
                    const paperSize = this.selectedPaperSizes[i].toLowerCase();
                    pdf.addPage([this.paperSizes[this.selectedPaperSizes[i]].width, 
                                this.paperSizes[this.selectedPaperSizes[i]].height], 
                               orientation);
                }
                await this.addWallTemplatePageCanvas(pdf, i);
            }
            
            // 生成PDF文件
            const timestamp = new Date().getTime();
            pdf.save(`光影投影模板_${timestamp}.pdf`);
            
        } catch (error) {
            console.error('PDF生成错误:', error);
            alert('PDF生成失败: ' + error.message);
        } finally {
            loading.style.display = 'none';
        }
    }
    
    // 使用Canvas绘制封面页并转为图片
    async addCoverPageCanvas(pdf) {
        const canvas = document.getElementById('pdf-cover-canvas');
        const ctx = canvas.getContext('2d');
        
        // 设置画布尺寸为A4 (210x297mm at 300 DPI ≈ 2480x3508 pixels)
        const dpi = 150; // 降低DPI以减小文件大小
        const widthMM = 210;
        const heightMM = 297;
        const widthPX = Math.round(widthMM * dpi / 25.4);
        const heightPX = Math.round(heightMM * dpi / 25.4);
        
        canvas.width = widthPX;
        canvas.height = heightPX;
        
        // 清空画布
        ctx.clearRect(0, 0, widthPX, heightPX);
        
        // 设置背景
        ctx.fillStyle = '#f8f9fa';
        ctx.fillRect(0, 0, widthPX, heightPX);
        
        // 绘制标题
        ctx.fillStyle = '#4361ee';
        ctx.font = `bold ${24 * dpi/72}px 'Noto Sans SC', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText('光影投影剪裁模板', widthPX/2, 60 * dpi/25.4);
        
        // 参数信息
        ctx.fillStyle = '#333';
        ctx.font = `${12 * dpi/72}px 'Noto Sans SC', Arial, sans-serif`;
        ctx.textAlign = 'left';
        
        const boxWidth = document.getElementById('box-width').value;
        const boxHeight = document.getElementById('box-height').value;
        const boxDepth = document.getElementById('box-depth').value;
        const lightHeight = document.getElementById('light-height').value;
        const shadowWidth = document.getElementById('shadow-width').value;
        
        let y = 100 * dpi/25.4;
        ctx.fillText(`盒子尺寸: ${boxWidth} × ${boxHeight} × ${boxDepth} cm`, 30 * dpi/25.4, y);
        y += 15 * dpi/25.4;
        ctx.fillText(`光源高度: ${lightHeight} cm`, 30 * dpi/25.4, y);
        y += 15 * dpi/25.4;
        ctx.fillText(`投影宽度: ${shadowWidth} cm`, 30 * dpi/25.4, y);
        y += 15 * dpi/25.4;
        ctx.fillText(`盒盖建议: ${this.lidRecommendation}`, 30 * dpi/25.4, y);
        y += 15 * dpi/25.4;
        ctx.fillText(`生成时间: ${new Date().toLocaleString('zh-CN')}`, 30 * dpi/25.4, y);
        
        // 使用说明
        y += 30 * dpi/25.4;
        ctx.font = `bold ${14 * dpi/72}px 'Noto Sans SC', Arial, sans-serif`;
        ctx.fillText('使用说明:', 30 * dpi/25.4, y);
        
        ctx.font = `${11 * dpi/72}px 'Noto Sans SC', Arial, sans-serif`;
        const instructions = [
            '1. 打印全部5页PDF文件',
            '2. 使用剪刀沿彩色实线剪裁第2-5页的模板',
            '3. 将剪裁后的纸片粘贴到硬纸板或亚克力板上',
            '4. 拼装成立体四面墙结构（上、左、下、右）',
            `5. ${this.lidRecommendation.includes('封顶') ? '为盒子加上顶盖' : '盒子顶部保持镂空'}`,
            '6. 在结构中心上方放置点光源（高度可调）',
            '7. 在暗室环境中观察投影效果',
            '8. 调整光源高度可改变投影大小和清晰度'
        ];
        
        y += 20 * dpi/25.4;
        instructions.forEach(text => {
            ctx.fillText(text, 45 * dpi/25.4, y);
            y += 12 * dpi/25.4;
        });
        
        // 将Canvas转为图片并添加到PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        pdf.addImage(imgData, 'JPEG', 0, 0, widthMM, heightMM);
    }
    
    // 使用Canvas绘制墙面模板页
    async addWallTemplatePageCanvas(pdf, wallIndex) {
        const canvasIds = ['pdf-top-canvas', 'pdf-left-canvas', 'pdf-bottom-canvas', 'pdf-right-canvas'];
        const canvas = document.getElementById(canvasIds[wallIndex]);
        const ctx = canvas.getContext('2d');
        
        const sideNames = ['上墙模板', '左墙模板', '下墙模板', '右墙模板'];
        const colors = [
            [255, 68, 68],    // 红色
            [68, 255, 68],    // 绿色
            [68, 68, 255],    // 蓝色
            [255, 170, 0]     // 橙色
        ];
        
        // 获取纸张尺寸
        const paperName = this.selectedPaperSizes[wallIndex];
        const paperSize = this.paperSizes[paperName];
        const orientation = this.selectedPaperOrientations[wallIndex];
        
        // 设置画布尺寸
        const dpi = 150;
        let widthMM, heightMM;
        
        if (orientation === 'portrait') {
            widthMM = paperSize.width;
            heightMM = paperSize.height;
        } else {
            widthMM = paperSize.height;
            heightMM = paperSize.width;
        }
        
        const widthPX = Math.round(widthMM * dpi / 25.4);
        const heightPX = Math.round(heightMM * dpi / 25.4);
        
        canvas.width = widthPX;
        canvas.height = heightPX;
        
        // 清空画布
        ctx.clearRect(0, 0, widthPX, heightPX);
        
        // 白色背景
        ctx.fillStyle = 'white';
        ctx.fillRect(0, 0, widthPX, heightPX);
        
        // 绘制页面边框
        ctx.strokeStyle = '#ccc';
        ctx.lineWidth = 1 * dpi/25.4;
        ctx.strokeRect(5 * dpi/25.4, 5 * dpi/25.4, widthPX - 10 * dpi/25.4, heightPX - 10 * dpi/25.4);
        
        // 页面标题
        ctx.fillStyle = `rgb(${colors[wallIndex][0]}, ${colors[wallIndex][1]}, ${colors[wallIndex][2]})`;
        ctx.font = `bold ${16 * dpi/72}px 'Noto Sans SC', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(sideNames[wallIndex], widthPX/2, 25 * dpi/25.4);
        
        // 绘制剪裁曲线
        const curve = this.cuttingCurves[wallIndex];
        if (curve.length > 1) {
            // 计算曲线在页面上的位置和缩放
            const margin = 20 * dpi/25.4;
            const pageWidth = widthPX - 2 * margin;
            const pageHeight = heightPX - 2 * margin;
            
            // 找到曲线的边界
            let minCoord = Infinity, maxCoord = -Infinity;
            let minHeight = Infinity, maxHeight = -Infinity;
            
            for (const point of curve) {
                let coord, height;
                switch (wallIndex) {
                    case 0: case 2: // 上墙、下墙
                        coord = point.x;
                        height = point.z;
                        break;
                    case 1: case 3: // 左墙、右墙
                        coord = point.y;
                        height = point.z;
                        break;
                }
                
                if (coord < minCoord) minCoord = coord;
                if (coord > maxCoord) maxCoord = coord;
                if (height < minHeight) minHeight = height;
                if (height > maxHeight) maxHeight = height;
            }
            
            const coordRange = maxCoord - minCoord || 1;
            const heightRange = maxHeight - minHeight || 1;
            
            // 绘制曲线
            ctx.strokeStyle = `rgb(${colors[wallIndex][0]}, ${colors[wallIndex][1]}, ${colors[wallIndex][2]})`;
            ctx.lineWidth = 2 * dpi/25.4;
            ctx.beginPath();
            
            for (let i = 0; i < curve.length; i++) {
                const point = curve[i];
                let coord, height;
                
                switch (wallIndex) {
                    case 0: case 2:
                        coord = point.x;
                        height = point.z;
                        break;
                    case 1: case 3:
                        coord = point.y;
                        height = point.z;
                        break;
                }
                
                const x = margin + ((coord - minCoord) / coordRange) * pageWidth;
                const y = margin + pageHeight - ((height - minHeight) / heightRange) * pageHeight;
                
                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }
            
            ctx.stroke();
            
            // 添加剪裁线指示（虚线）
            ctx.strokeStyle = '#000';
            ctx.lineWidth = 0.5 * dpi/25.4;
            ctx.setLineDash([5 * dpi/25.4, 3 * dpi/25.4]);
            ctx.strokeRect(margin - 5 * dpi/25.4, margin - 5 * dpi/25.4, 
                          pageWidth + 10 * dpi/25.4, pageHeight + 10 * dpi/25.4);
            ctx.setLineDash([]);
        }
        
        // 添加页面说明
        ctx.fillStyle = '#333';
        ctx.font = `${10 * dpi/72}px 'Noto Sans SC', Arial, sans-serif`;
        ctx.textAlign = 'center';
        ctx.fillText(`使用 ${paperName} ${orientation === 'landscape' ? '横向' : '纵向'} 纸张打印`, 
                    widthPX/2, heightPX - 15 * dpi/25.4);
        ctx.fillText('沿彩色实线剪裁，沿虚线折叠', widthPX/2, heightPX - 5 * dpi/25.4);
        
        // 将Canvas转为图片并添加到PDF
        const imgData = canvas.toDataURL('image/jpeg', 0.9);
        pdf.addImage(imgData, 'JPEG', 0, 0, widthMM, heightMM);
    }
    
    printTemplates() {
        if (this.cuttingCurves.flat().length === 0) {
            alert('请先计算剪裁曲线！');
            return;
        }
        
        alert('打印功能：请先生成PDF文件，然后使用系统的打印功能打印PDF。');
        this.generatePDF();
    }
    
    reset() {
        // 重置状态
        this.imageData = null;
        this.originalImage = null;
        this.binaryImageData = null;
        this.contourPoints = [];
        this.smoothedPolarPoints = [];
        this.sampledPoints = [];
        this.cuttingCurves = [[], [], [], []];
        this.zoomLevel = 1.0;
        this.shouldInvert = false;
        this.lidRecommendation = "等待计算...";
        this.selectedPaperSizes = ['A4', 'A4', 'A4', 'A4'];
        this.selectedPaperOrientations = ['portrait', 'portrait', 'portrait', 'portrait'];
        
        // 重置UI
        const previewCanvases = [
            'preview-original', 'preview-binary', 'preview-contour', 'preview-smooth',
            'thumb-cover', 'thumb-top', 'thumb-left', 'thumb-bottom', 'thumb-right'
        ];
        
        previewCanvases.forEach(id => {
            const canvas = document.getElementById(id);
            if (canvas) {
                const ctx = canvas.getContext('2d');
                ctx.clearRect(0, 0, canvas.width, canvas.height);
            }
        });
        
        document.getElementById('file-input').value = '';
        document.getElementById('threshold').value = 128;
        document.getElementById('threshold-value').textContent = '128';
        document.getElementById('smoothness').value = 5;
        document.getElementById('smoothness-value').textContent = '5';
        document.getElementById('box-width').value = 10;
        document.getElementById('box-width-value').textContent = '10';
        document.getElementById('box-height').value = 10;
        document.getElementById('box-height-value').textContent = '10';
        document.getElementById('box-depth').value = 10;
        document.getElementById('box-depth-value').textContent = '10';
        document.getElementById('light-height').value = 5;
        document.getElementById('light-height-value').textContent = '5';
        document.getElementById('shadow-width').value = 30;
        document.getElementById('shadow-width-value').textContent = '30';
        document.getElementById('sample-count').value = 200;
        document.getElementById('sample-count-value').textContent = '200';
        
        document.getElementById('auto-invert-value').textContent = '自动';
        document.getElementById('lid-recommendation-value').textContent = '等待计算...';
        document.getElementById('lid-recommendation-value').style.color = '';
        document.getElementById('lid-recommendation-text').textContent = '上传图像后自动计算建议';
        this.shouldInvert = false;
        
        // 重置参数显示
        document.getElementById('param-image-size').textContent = '未加载';
        document.getElementById('param-contour-points').textContent = '0';
        document.getElementById('param-sample-points').textContent = '0';
        document.getElementById('param-paper-size').textContent = 'A4 纵向';
        
        this.updateSteps(1);
        this.updateParamDisplay();
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', () => {
    window.shadowCutter = new FourWallShadowCutter();
    console.log('四壁光影投影剪裁模板生成器（重构版）已初始化！');
});