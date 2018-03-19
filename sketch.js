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
        color: '#1abc9c',
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
        name: 'offic-core',
        color: '#d35400',
        unit: 18
    }
};

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
            distance: 1200, 
            center: [0, 0, 300], 
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

    //random for testing
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            generations[0][i][j] = floor(random(2));
        }
    }

    //random with types
    // for (let i = 0; i < cols; i++) {
    //     for (let j = 0; j < rows; j++) {
    //         generations[0][i][j] = floor(random(Object.keys(cellTypes).length));
    //     }
    // }
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

    pointLight(255, 255, 255, 0, 0, 15000);
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
                if (generations[layer][i][j] !== 0) {
                    ambientMaterial(cellTypes[generations[layer][i][j]]['color']);
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
            nextGeneration[i][j] = applyRules('game-of-life', lastGeneration, i, j);
        }
    }

    generations.push(nextGeneration);

    return nextGeneration;
}

function applyRules(ruleSet, generation, i, j) {
    if (ruleSet == 'game-of-life') {
        let state = generation[i][j];
        let sumNeighbours = countNeighbours(getNeighbours(generation, i, j), '1');

        if (state === 0 && sumNeighbours === 3) {
            return 1;
        } else if (state === 1 && (sumNeighbours < 2 || sumNeighbours > 3)) {
            return 0;
        } else {
            return state;
        }
    }
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


function countNeighbours(neighbours, cellType) {
    if (typeof(cellType) === 'undefined') cellType = '1';

    let sum = 0;

    for (let i = 0; i < neighbours.length; i++) {
        if (neighbours[i] === '1') {
            sum += 1;
        }
    }

    return sum;
}