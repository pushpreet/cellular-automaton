let plotSizeX = 45;
let plotSizeY = 90;
let unitSize = 9;
let floors = 20;

let mainWindowPadding;
let _top;
let _left;
let _right;
let _bottom;
let gridTopLeftPoint;

let canvasSizeX;
let canvasSizeY;

let scaledPlotSizeX;
let scaledPlotSizeY;
let scaledUnitSize;

let rows;
let cols;

var mainWindow;
var canvas;

var easycam;

let renderType = '3D';
var generationTimer;

var generations = [];

function setup() {
    pixelDensity(1);

    mainWindow = document.getElementById('main-window');
    canvasSizeX = mainWindow.clientWidth;
    canvasSizeY = mainWindow.clientHeight;

    canvas = createCanvas(canvasSizeX, canvasSizeY, WEBGL);

    canvas.style('display', 'block');
    canvas.class('col-lg-12 col-md-12 col-sm-12 col-xs-12 padding-0');
    canvas.parent('main-window');

    //setAttributes('antialiasing', true);

    easycam = createEasyCam(
        {
            distance: 1000, 
            center: [0, 0, 0], 
            rotation: [-0.73657645671131, -0.473425444805009, 0.22421945906390903, -0.4278423843039303]
        }
    );

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

    gridTopLeftPoint = createVector(
        (_left + _right)/2 - scaledPlotSizeX/2 + scaledUnitSize/2,
        (_top + _bottom)/2 - scaledPlotSizeY/2 + scaledUnitSize/2,
        scaledUnitSize/2
    );

    rows = plotSizeX / unitSize;
    cols = plotSizeY / unitSize;

    setInitialGeneration(cols, rows);
    generationTimer = setInterval(function () {computeNextGeneration(generations)}, 100);
}

function windowResized() {
    canvasSizeX = mainWindow.clientWidth;
    canvasSizeY = mainWindow.clientHeight;

    resizeCanvas(canvasSizeX, canvasSizeY);
    easycam.setViewport([0,0,windowWidth, windowHeight]);

    mainWindowPadding = canvasSizeY/10;
    _top = 0 - canvasSizeY/2;
    _left = 0 - canvasSizeX/2;
    _right = 0 + canvasSizeX/2;
    _bottom = 0 + canvasSizeY/2;

    gridTopLeftPoint = set(
        (_left + _right)/2 - scaledPlotSizeX/2 + scaledUnitSize/2,
        (_top + _bottom)/2 - scaledPlotSizeY/2 + scaledUnitSize/2,
        scaledUnitSize/2
    );
}

function draw() {
    drawUI();
    setLights();
    drawGrid();
    drawLayers(generations);

    if (generations.length === floors) {
        clearInterval(generationTimer);
    }
}

function mouseWheel(event) {
    return false;
}

function setInitialGeneration(cols, rows) {
    generations.length = 0;
    generations.push(make2DArray(cols, rows));

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            generations[0][i][j] = floor(random(2));
        }
    }
}

function drawUI() {
    // set background color
    background('#34495e');
}

function setLights() {
    pointLight(255, 255, 255, 2*_left, 2*_top, 500);
    pointLight(255, 255, 255, 2*_right, 2*_top, 500);
    pointLight(255, 255, 255, 2*_right, 2*_bottom, 500);
    pointLight(255, 255, 255, 2*_left, 2*_bottom, 500);
}

function drawGrid() {
    stroke('#7f8c8d');
    strokeWeight(2);
        
    for (let i = 0; i < rows + 1; i++) {
        let x = i * scaledUnitSize;

        line((_left + _right)/2 - scaledPlotSizeX/2 + x, (_top + _bottom)/2 - scaledPlotSizeY/2 - mainWindowPadding/2, 
                (_left + _right)/2 - scaledPlotSizeX/2 + x, (_top + _bottom)/2 + scaledPlotSizeY/2 + mainWindowPadding/2);
    }

    for (let j = 0; j < cols + 1; j++) {
        let y = j * scaledUnitSize;

        line((_left + _right)/2 - scaledPlotSizeX/2 - mainWindowPadding/2, (_top + _bottom)/2 - scaledPlotSizeY/2 + y, 
                (_left + _right)/2 + scaledPlotSizeX/2 + mainWindowPadding/2, (_top + _bottom)/2 - scaledPlotSizeY/2 + y);
    }
}

function drawLayers(generations, layerStart, layerEnd) {
    if (typeof(layerStart) === 'undefined') layerStart = 0;
    if (typeof(layerEnd) === 'undefined') layerEnd = generations.length;

    translate(gridTopLeftPoint.x, gridTopLeftPoint.y, gridTopLeftPoint.z + (scaledUnitSize * layerStart));

    for (let layer = layerStart; layer < layerEnd; layer++) {
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < rows; j++) {
                if (generations[layer][i][j] == 1) {
                    ambientMaterial('#16a085')
                    box(scaledUnitSize);
                }
                translate(scaledUnitSize, 0, 0);
            }
            translate(-rows * scaledUnitSize, scaledUnitSize, 0);
        }
        translate(0, -cols * scaledUnitSize, scaledUnitSize);
    }
}

function make2DArray(cols, rows) {
    let arr = new Array(cols);
    for (let i = 0; i < arr.length; i++) {
        arr[i] = new Array(rows);
    }

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            arr[i][j] = 0;
        }
    }
    
    return arr;
}

function computeNextGeneration(generations) {
    let nextGeneration = make2DArray(cols, rows);
    let lastGeneration = generations.slice(-1)[0];

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let state = lastGeneration[i][j];
            let sumNeighbours = countNeighbours(getNeighbours(lastGeneration, i, j));

            if (state === 0 && sumNeighbours === 3) {
                nextGeneration[i][j] = 1;
            } else if (state === 1 && (sumNeighbours < 2 || sumNeighbours > 3)) {
                nextGeneration[i][j] = 0;
            } else {
                nextGeneration[i][j] = state;
            }
        }
    }

    generations.push(nextGeneration);

    return nextGeneration;
}

function getNeighbours(grid, x, y) {
    let neighbours = '';

    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            let col = (x + i + cols) % cols;
            let row = (y + j + rows) % rows;
            
            if (i !== 0 || j !== 0) {
                    neighbours += grid[col][row].toString();    
            }
        }
    }

    return neighbours;
}


function countNeighbours(neighbours) {
    let sum = 0;

    for (let i = 0; i < neighbours.length; i++) {
        sum += parseInt(neighbours[i]);
    }

    return sum;
}