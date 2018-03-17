let plotSizeX = 1000;
let plotSizeY = 1000;
let unitSize = 100;

let mainWindowPadding;
let leftMenuWidth;
let _top;
let _left;
let _right;
let _bottom;

let canvasSizeX;
let canvasSizeY;

let scaledPlotSizeX;
let scaledPlotSizeY;
let scaledUnitSize;

let rows;
let cols;

let grid;
let oldGrid;

function setup() {
    canvasSizeX = windowWidth - 15;
    canvasSizeY = windowHeight - 15;

    createCanvas(canvasSizeX, canvasSizeY, WEBGL);

    mainWindowPadding = canvasSizeY/10;
    leftMenuWidth = canvasSizeX/6;
    _top = 0 - canvasSizeY/2;
    _left = 0 - canvasSizeX/2 + leftMenuWidth;
    _right = 0 + canvasSizeX/2;
    _bottom = 0 + canvasSizeY/2;
    
    let scale = ((((canvasSizeX - mainWindowPadding*2)/plotSizeX) < ((canvasSizeY - mainWindowPadding*2)/plotSizeY)) ? 
                ((canvasSizeX - mainWindowPadding*2)/plotSizeX) : ((canvasSizeY - mainWindowPadding*2)/plotSizeY));

    scaledPlotSizeX = plotSizeX * scale;
    scaledPlotSizeY = plotSizeY * scale;
    scaledUnitSize = unitSize * scale;

    rows = plotSizeX / unitSize;
    cols = plotSizeY / unitSize;

    grid = make2DArray(cols, rows);
    oldGrid = make2DArray(cols, rows);

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            grid[i][j] = floor(random(2));
        }
    }

    frameRate(6);
}

function draw() {
    drawUI();

    drawGrid(grid);
    //grid = computeNextGeneration(grid);
}

function windowResized() {
    canvasSizeX = windowWidth - 15;
    canvasSizeY = windowHeight - 15;

    resizeCanvas(canvasSizeX, canvasSizeY);

    mainWindowPadding = canvasSizeY/10;
    leftMenuWidth = canvasSizeX/6;
    _top = 0 - canvasSizeY/2;
    _left = 0 - canvasSizeX/2 + leftMenuWidth;
    _right = 0 + canvasSizeX/2;
    _bottom = 0 + canvasSizeY/2;
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

function drawUI() {
    // set backgroung color
    background('#34495e');

    // draw the left line separator
    stroke(0);
    strokeWeight(5);
    line(_left, _top, _left, _bottom);

    // make the left pane a darker color
    noStroke();
    fill('#2c3e50');
    rect(0 - canvasSizeX/2, 0 - canvasSizeY/2, leftMenuWidth, canvasSizeY);
}

function drawGrid(grid) {
    stroke('#7f8c8d');
    strokeWeight(2);
        
    for (let i = 0; i < cols + 1; i++) {
        let x = i * scaledUnitSize;

        line((_left + _right)/2 - scaledPlotSizeX/2 + x, (_top + _bottom)/2 - scaledPlotSizeY/2 - mainWindowPadding/2, 
                (_left + _right)/2 - scaledPlotSizeX/2 + x, (_top + _bottom)/2 + scaledPlotSizeY/2 + mainWindowPadding/2);
    }

    for (let j = 0; j < rows + 1; j++) {
        let y = j * scaledUnitSize;

        line((_left + _right)/2 - scaledPlotSizeX/2 - mainWindowPadding/2, (_top + _bottom)/2 - scaledPlotSizeY/2 + y, 
                (_left + _right)/2 + scaledPlotSizeX/2 + mainWindowPadding/2, (_top + _bottom)/2 - scaledPlotSizeY/2 + y);
    }

    // for (let i = 0; i < cols; i++) {
    //     for (let j = 0; j < rows; j++) {
    //         let x = i * scaledUnitSize;
    //         let y = j * scaledUnitSize;

    //         if (grid[i][j] == 0) {
    //             fill(0);
    //         }
    //         else {
    //             fill(255);
    //         }

    //         rect(x - canvasSizeX/2, y - canvasSizeY/2 + mainWindowPadding/2, scaledUnitSize-1, scaledUnitSize - 1);
    //     }
    // }

    //translate(0, 0, 0);
    //fill(255);
    //box(scaledUnitSize - 1, scaledUnitSize - 1, scaledUnitSize - 1);
}

function computeNextGeneration(grid) {
    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            oldGrid[i][j] = grid[i][j];
        }
    }

    for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
            let state = oldGrid[i][j];
            let sumNeighbours = countNeighbours(getNeighbours(oldGrid, i, j));

            if (state == 0 && sumNeighbours == 3) {
                grid[i][j] = 1;
            } else if (state == 1 && (sumNeighbours < 2 || sumNeighbours > 3)) {
                grid[i][j] = 0;
            } else {
                grid[i][j] = state;
            }
        }
    }

    return grid;
}

function getNeighbours(grid, x, y) {
    let neighbours = '';

    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            let col = (x + i + cols) % cols;
            let row = (y + j + rows) % rows;
            
            if (i != 0 || j != 0) {
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