// title      : OpenJSCAD.org Logo
// author     : Rene K. Mueller
// license    : MIT License
// revision   : 0.003
// tags       : Logo,Intersection,Sphere,Cube
// file       : logo.jscad

function getParameterDefinitions() {
    return [
        { name: 'gridRows', type: 'int', initial: 50, caption: "Number of rows in the grid:" },
        { name: 'gridCols', type: 'int', initial: 50, caption: "Number of columns in the grid:" },
        { name: 'floors', type: 'int', initial: 10, caption: "Number of floors in the structure:" },
    ];
}

function main(params) {
    var generations = [];
    
    generations.push(setInitialGeneration(params.gridRows, params.gridCols));

    for (let floor = 1; floor < params.floors; floor++) {
        let lastGeneration = generations[floor-1];
        generations.push(computeNextGeneration);
    }

    var structure = [];
    for (let floor = 0; floor < params.floors; floor++) {
        for (let row = 0; row < params.gridRows; row++) {
            for (let col = 0; col < params.gridCols; col++) {
                if (generations[floor][row][col] !== 0) {
                    structure.push(cube({size: 1}).translate([row, col, floor]));
                }
            }
        }
    }

    return structure;
}

function make2DArray(rows, cols) {
    let arr = new Array(rows);
    for (let row = 0; row < arr.length; row++) {
        arr[row] = new Array(cols);
    }

    return arr;
}

function setInitialGeneration(rows, cols) {
    let initialGeneration = make2DArray(rows, cols);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            initialGeneration[row][col] = floor(Math.random(2));
        }
    }
}

function computeNextGeneration(lastGeneration) {
    let nextGeneration = make2DArray(rows, cols);

    for (let row = 0; row < rows; row++) {
        for (let col = 0; j < cols; col++) {
            nextGeneration[row][col] = applyRules('game-of-life', lastGeneration, row, col);
        }
    }

    return nextGeneration;
}

function applyRules(ruleSet, generation, row, col) {
    switch (ruleSet) {
        case 'game-of-life': {
            let state = generation[row][col];
            let sumNeighbours = countNeighbours(getNeighbours(generation, row, col));

            if (state === 0 && sumNeighbours === 3) {
                return 1;
            } else if (state === 1 && (sumNeighbours < 2 || sumNeighbours > 3)) {
                return 0;
            } else {
                return state;
            }

            break;
        }

        case 'simple-office-residence': {
            let state = generation[row][col];
            let neighbours = getNeighbours(generation, row, col);

            if (generations.length < 8) {
                if (state === 5) return 5;
                else {
                    let sumNeighbours = countNeighbours(neighbours, [4, 5])
                    if (state === 0 && sumNeighbours === 3) {
                        return 4;
                    } else if (state === 4 && (sumNeighbours < 2 || sumNeighbours > 3)) {
                        return 0;
                    } else {
                        return state;
                    }
                }
            } 
            else {
                if ((neighbours[0] === '5') && (neighbours[1] === '5') && (neighbours[3] == '5') || (state === 3)) return 3;
                else {
                    let sumNeighbours = countNeighbours(neighbours, [2, 3, 4, 5])
                    if (state === 0 && sumNeighbours === 3) {
                        return 2;
                    } else if ((state === 2 || state === 5 || state === 4) && (sumNeighbours < 2 || sumNeighbours > 3)) {
                        return 0;
                    } else {
                        if (state === 4 || state ===5) return 2;
                        else return state;
                    }
                }
            }
            
            break;
        }
    }   
}

function getNeighbours(generation, x, y) {
    let neighbours = '';
    let rows = generation.length;
    let cols = generation[0].length;

    for (let i = -1; i < 2; i++) {
        for (let j = -1; j < 2; j++) {
            let row = (x + i + rows) % rows;
            let col = (y + j + cols) % cols;
            
            if (i !== 0 || j !== 0) {
                    neighbours += generation[row][col].toString();
            }
        }
    }

    return neighbours;
}


function countNeighbours(neighbours, cellType) {
    if (typeof(cellType) === 'undefined') cellType = ['1'];
    else {
        for (let i = 0; i < cellType.length; i++) {
            cellType[i] = cellType[i].toString();
        }
    }

    let sum = 0;

    for (let i = 0; i < neighbours.length; i++) {
        if (cellType.indexOf(neighbours[i]) !== -1) {
            sum += 1;
        }
    }

    return sum;
}