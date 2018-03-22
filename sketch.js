var plotSizeX = 45;
var plotSizeY = 90;
var unitSize = 9;
var floors = 14;    

var cellTypes = {
    0: {
        name: 'empty',
        color: '',
        unit: 0
    },

    1: {
        name: 'binary',
        color: '#16a085',
        unit: 1
    },

    2: {
        name: 'residential-basic',
        color: '#2ecc71',
        unit: 9
    },

    3: {
        name: 'residential-core',
        color: '#16a085',
        unit: 9
    },

    4: {
        name: 'office-basic',
        color: '#e67e22',
        unit: 18
    },

    5: {
        name: 'office-core',
        color: '#d35400',
        unit: 18
    }
};

var sketch = function(p) {
    let mainWindow;
    let canvasSizeX;
    let canvasSizeY;

    let mainWindowPadding;
    let _top;
    let _left;
    let _right;
    let _bottom;
    let gridTopLeft;

    let gridRows = plotSizeX / unitSize;
    let gridCols = plotSizeY / unitSize;

    let renderType = '3D';
    let layerDrawTimer;

    var automaton;

    p.setup = function() {
        p.pixelDensity(1);

        mainWindow = document.getElementById('main-window');
        canvasSizeX = mainWindow.clientWidth-3;
        canvasSizeY = mainWindow.clientHeight-3;

        let canvas = p.createCanvas(canvasSizeX, canvasSizeY, p.WEBGL);
        canvas.style('display', 'block');
        canvas.class('col-lg-12 col-md-12 col-sm-12 col-xs-12 padding-0');

        p.setAttributes('antialiasing', true);

        mainWindowPadding = canvasSizeY/10;
        _top = 0 - canvasSizeY/2;
        _left = 0 - canvasSizeX/2;
        _right = 0 + canvasSizeX/2;
        _bottom = 0 + canvasSizeY/2;
        
        let scale = ((((canvasSizeX - mainWindowPadding*2)/plotSizeX) < ((canvasSizeY - mainWindowPadding*2)/plotSizeY)) ? 
                    ((canvasSizeX - mainWindowPadding*2)/plotSizeX) : ((canvasSizeY - mainWindowPadding*2)/plotSizeY));

        scaledPlotSizeX = plotSizeX * scale;
        scaledPlotSizeY = plotSizeY * scale;
        scaledUnitSize = unitSize * scale;

        gridTopLeft = p.createVector(
            (_left + _right)/2 - scaledPlotSizeX/2 + scaledUnitSize/2,
            (_top + _bottom)/2 - scaledPlotSizeY/2 + scaledUnitSize/2,
            scaledUnitSize/2
        );

        automaton = new CellularAutomaton(gridRows, gridCols);
        automaton.setInitialGeneration();

        layerDrawTimer = setInterval(function () {automaton.computeNextGeneration()}, 100);
    }

    p.windowResized = function() {
        canvasSizeX = mainWindow.clientWidth-3;
        canvasSizeY = mainWindow.clientHeight-3;

        p.resizeCanvas(canvasSizeX, canvasSizeY);

        mainWindowPadding = canvasSizeY/10;
        _top = 0 - canvasSizeY/2;
        _left = 0 - canvasSizeX/2;
        _right = 0 + canvasSizeX/2;
        _bottom = 0 + canvasSizeY/2;

        gridTopLeft = set(
            (_left + _right)/2 - scaledPlotSizeX/2 + scaledUnitSize/2,
            (_top + _bottom)/2 - scaledPlotSizeY/2 + scaledUnitSize/2,
            scaledUnitSize/2
        );
    }

    p.draw = function() {
        drawUI();
        setLights();
        drawGrid();
        drawLayers(automaton.generations);
    }

    p.mouseWheel = function(event) {
        return false;
    }

    function drawUI() {
        // set background color
        p.background('#34495e');
    }

    function setLights() {
        p.pointLight(255, 255, 255, 2*_left, 2*_top, 500);
        p.pointLight(255, 255, 255, 2*_right, 2*_top, 500);
        p.pointLight(255, 255, 255, 2*_right, 2*_bottom, 500);
        p.pointLight(255, 255, 255, 2*_left, 2*_bottom, 500);

        p.pointLight(255, 255, 255, 0, 0, 15000);
    }

    function drawGrid() {
        p.stroke('#7f8c8d');
        p.strokeWeight(2);
            
        for (let i = 0; i < gridRows + 1; i++) {
            let x = i * scaledUnitSize;

            p.line((_left + _right)/2 - scaledPlotSizeX/2 + x, (_top + _bottom)/2 - scaledPlotSizeY/2 - mainWindowPadding/2, 
                    (_left + _right)/2 - scaledPlotSizeX/2 + x, (_top + _bottom)/2 + scaledPlotSizeY/2 + mainWindowPadding/2);
        }

        for (let j = 0; j < gridCols + 1; j++) {
            let y = j * scaledUnitSize;

            p.line((_left + _right)/2 - scaledPlotSizeX/2 - mainWindowPadding/2, (_top + _bottom)/2 - scaledPlotSizeY/2 + y, 
                    (_left + _right)/2 + scaledPlotSizeX/2 + mainWindowPadding/2, (_top + _bottom)/2 - scaledPlotSizeY/2 + y);
        }
    }

    function drawLayers(generations, layerStart, layerEnd) {
        if (typeof(layerStart) === 'undefined') layerStart = 0;
        if (typeof(layerEnd) === 'undefined') layerEnd = generations.length;

        p.translate(gridTopLeft.x, gridTopLeft.y, gridTopLeft.z + (scaledUnitSize * layerStart));

        for (let layer = layerStart; layer < layerEnd; layer++) {
            for (let i = 0; i < gridRows; i++) {
                for (let j = 0; j < gridCols; j++) {
                    if (generations[layer][i][j] !== 0) {
                        p.ambientMaterial(cellTypes[generations[layer][i][j]]['color']);
                        p.box(scaledUnitSize);
                    }
                    p.translate(0, scaledUnitSize, 0);
                }
                p.translate(scaledUnitSize, -gridCols * scaledUnitSize, 0);
            }
            p.translate(-gridRows * scaledUnitSize, 0, scaledUnitSize);
        }
    }
}

new p5(sketch, 'main-window');