function CellularAutomaton(rows, cols, ruleset, wraparound, buildingParameters) {
    if (typeof(rows) === 'undefined') rows = 10;
    if (typeof(cols) === 'undefined') cols = 10;
    if (typeof(ruleset) === 'undefined') ruleset = 'game-of-life';
    if (typeof(wraparound) === 'undefined') wraparound = true;
    if (typeof(buildingParameters) === 'undefined') buildingParameters = {};

    this.rows = rows;
    this.cols = cols;
    this.ruleset = ruleset;
    this.wraparound = wraparound;
    this.buildingParameters = buildingParameters;

    this.customRuleset = {};
    this.generations = [];

    this.rulesets = [
        'game-of-life',
        'crooked-game-of-life',
        'sheet-000',
        'custom',
    ]

    this.make2DArray = function() {
        let arr = new Array(this.rows);
        for (let row = 0; row < arr.length; row++) {
            arr[row] = new Array(this.cols);
        }

        return arr;
    }

    this.initialise = function(rows, cols) {
        this.rows = rows;
        this.cols = cols;

        this.generations = [];
    }

    this.setWraparound = function(wraparound) {
        this.wraparound = wraparound;
    }

    this.setRuleset = function(ruleset) {
        this.ruleset = ruleset;
    }

    this.setBuildingParameters = function(buildingParameters) {
        this.buildingParameters = buildingParameters;
    }

    this.setCustomRuleset = function(customRuleset) {
        this.customRuleset = customRuleset;
    }

    this.reset = function() {
        this.generations = [this.generations[0]]
    }

    this.toggleCell = function(floor, x, y) {
        if (typeof this.generations[floor] === 'undefined') {
            return -1;
        }
        else {
            if (!(x < 0 || x >= this.rows || y < 0 || y >= this.cols)) {
                if (this.generations[floor][x][y] !== 0) {
                    this.generations[floor][x][y] = 0;
                }
                else {   
                    this.generations[floor][x][y] = this.buildingParameters['cellTypes'][floor][0];

                    let coreCells = this.buildingParameters['coreCells'][floor];
                    for (let i = 0; i < coreCells.length; i++) {
                        if (x === coreCells[i][0] && y === coreCells[i][1]) {
                            this.generations[floor][x][y] = this.buildingParameters['cellTypes'][floor][1];
                            return 0;
                        }
                    }

                    let deadCells = this.buildingParameters['deadCells'][floor];
                    for (let i = 0; i < deadCells.length; i++) {
                        if (x === deadCells[i][0] && y === deadCells[i][1]) {
                            this.generations[floor][x][y] = 0;
                            return -2;
                        }
                    }
                    return 0;
                }
            }
            else {
                return -1;
            }
        }
    }

    this.setInitialGeneration = function(generation, useBuildingParameters) {
        if (typeof(generation) === 'undefined') generation = 'random';
        if (typeof(useBuildingParameters) === 'undefined') useBuildingParameters = true;

        let initialGeneration = this.make2DArray();

        if (generation === 'random') {
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    if (Math.floor(Math.random(2) * 2) === 0) {
                        initialGeneration[row][col] = 0;
                    }
                    else {
                        if (useBuildingParameters) initialGeneration[row][col] = this.buildingParameters['cellTypes'][0][0];
                        else initialGeneration[row][col] = 1;
                    }
                }
            }
        }
        else if (generation === 'empty') {
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    initialGeneration[row][col] = 0;
                }
            }
        }
        else if (generation.length === this.rows && generation[0].length === this.cols) {
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    initialGeneration[row][col] = generation[row][col];
                }
            }
        }
        else {
            return -1;
        }

        if (useBuildingParameters) {
            let coreCells = this.buildingParameters['coreCells']['0'];
            for (let i = 0; i < coreCells.length; i++) {
                initialGeneration[coreCells[i][0]][coreCells[i][1]] = this.buildingParameters['cellTypes'][0][1];
            }

            let deadCells = this.buildingParameters['deadCells']['0'];
            for (let i = 0; i < deadCells.length; i++) {
                initialGeneration[deadCells[i][0]][deadCells[i][1]] = 0;
            }

            let requiredFillPercentage = this.buildingParameters['floorFill'][0];
            if (requiredFillPercentage !== -1) {
                this.fillFloor(initialGeneration, requiredFillPercentage, 0);
            }
        }

        this.generations = [];
        this.generations.push(initialGeneration);
        return initialGeneration;
    }

    this.computeNextGeneration = function() {
        let nextGeneration = this.make2DArray();
        let lastGeneration = this.generations.slice(-1)[0];
    
        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                nextGeneration[row][col] = this.applyRules(this.ruleset, lastGeneration, row, col);
            }
        }

        if (!isEmpty(this.buildingParameters)) {
            let nextFloor = this.generations.length;
            let requiredFillPercentage = this.buildingParameters['floorFill'][nextFloor];

            if (requiredFillPercentage !== -1) {
                this.fillFloor(nextGeneration, requiredFillPercentage, nextFloor);
            }
        }
        
        this.generations.push(nextGeneration);
        return nextGeneration;
    }

    this.computeGenerations = function(count) {
        this.generations = [this.generations[0]]

        for (let i = 1; i < count; i++) {
            this.computeNextGeneration();
        }

        return this.generations;
    }

    this.applyRules = function(ruleSet, generation, row, col) {
        let aliveIndicator = 1;
        let coreIndicator = -1;
        
        if (!isEmpty(this.buildingParameters)) {
            let nextFloor = this.generations.length;
            aliveIndicator = this.buildingParameters['cellTypes'][nextFloor][0];
            coreIndicator = this.buildingParameters['cellTypes'][nextFloor][1];

            let coreCells = this.buildingParameters['coreCells'][nextFloor];
            for (let i = 0; i < coreCells.length; i++) {
                if (row === coreCells[i][0] && col === coreCells[i][1]) {
                    return coreIndicator;
                }
            }

            let deadCells = this.buildingParameters['deadCells'][nextFloor];
            for (let i = 0; i < deadCells.length; i++) {
                if (row === deadCells[i][0] && col === deadCells[i][1]) {
                    return 0;
                }
            }
        }

        let state = generation[row][col];

        switch (ruleSet) {
            case 'game-of-life': {
                let sumNeighbours = this.countNeighbours(this.getNeighbours(generation, row, col));
                
                if (state === 0 && sumNeighbours === 3) {
                    return aliveIndicator;
                } else if (state !== 0 && (sumNeighbours < 2 || sumNeighbours > 3)) {
                    return 0;
                } else {
                    if (state !== 0) return aliveIndicator;
                    else return state;
                }
    
                break;
            }

            case 'crooked-game-of-life': {
                let sumNeighbours = this.countNeighbours(this.getNeighbours(generation, row, col));
    
                if (state === 0 && sumNeighbours === 4) {
                    return aliveIndicator;
                } else if (state !== 0 && (sumNeighbours < 3 || sumNeighbours > 4)) {
                    return 0;
                } else {
                    if (state !== 0) return aliveIndicator;
                    else return state;
                }
    
                break;
            }

            case 'sheet-000': {
                let neighbours = this.getNeighbours(generation, row, col);

                let birth = [
                    '1278', '2367', '3456', '1458',
                    '1267', '2378', '1345', '4568',
                    '124578', '234578',
                    '2457',
                    '1246', '1235', '3578', '1467', '4678', '5678', '2358', '1234',
                    '1237', '3458', '1456', '2678',
                    '1258', '2346', '3567', '1478',
                    '123', '358', '678', '146',
                    '127', '237', '145', '456', '267', '278', '345', '458',
                    '1245', '2345', '4567', '4578', '1247', '2357', '2467', '2578'];

                let death = [
                    '1368', 
                    '36', '18',
                    '1358', '1346', '1678', '3678', '1236', '3568', '1238', '1568',
                    '128', '236', '148', '356', '178', '367', '158', '346',
                    '134', '468', '378', '238', '126', '568', '135', '167',
                    '2356', '1248', '3467', '1578'];

                if (state === 0 && this.isNeighbourAlive(neighbours, birth))
                    return aliveIndicator;
                else if (state !== 0 && this.isNeighbourAlive(neighbours, death))
                    return 0;
                else {
                    if (state === 0) return 0;
                    else return aliveIndicator;
                }

                break;
            }

            case 'custom': {
                let neighbours = this.getNeighbours(generation, row, col);

                let birth = this.customRuleset['birth'];
                let death = this.customRuleset['death'];

                if (state === 0 && this.isNeighbourAlive(neighbours, birth))
                    return aliveIndicator;
                else if (state !== 0 && this.isNeighbourAlive(neighbours, death, 'loose'))
                    return 0;
                else {
                    if (state === 0) return 0;
                    else return aliveIndicator;
                }

                break;
            }
        }
    }

    this.fillFloor = function(generation, requiredFillPercentage, nextFloor) {
        let fillPercent = 0;
        let totalCells = this.rows * this.cols;

        for (let row = 0; row < this.rows; row++) {
            for (let col = 0; col < this.cols; col++) {
                if (generation[row][col] !== 0) {
                    fillPercent += 1;
                }
            }
        }

        fillPercent /= totalCells;
        fillPercent *= 100;

        if (fillPercent < requiredFillPercentage) {
            let requiredExtraCells = Math.ceil((requiredFillPercentage - fillPercent) * totalCells / 100);
            let deadCells = this.buildingParameters['deadCells'][nextFloor];

            if ((totalCells - (fillPercent * totalCells / 100) - deadCells.length) < requiredExtraCells) {
                requiredExtraCells = totalCells - (fillPercent * totalCells / 100) - deadCells.length;
            }
            
            while (true) {
                for (let row = 0; row < this.rows; row++) {
                    for (let col = 0; col < this.cols; col++) {
                        if (generation[row][col] === 0) {
                            let dead = false;
                            for (let k = 0; k < deadCells.length; k++) {
                                if (row === deadCells[k][0] && col === deadCells[k][1]) {
                                    dead = true;
                                }
                            }
                            if (!dead) {
                                if (Math.floor(Math.random(2) * 2) === 1) {
                                    generation[row][col] = this.buildingParameters['cellTypes'][nextFloor][0];
                                    requiredExtraCells -= 1;

                                    if (requiredExtraCells === 0) break;
                                }
                            }
                        }
                    }
                    if (requiredExtraCells === 0) break;
                }
                if (requiredExtraCells === 0) break;
            }
        }
    }
    
    this.getNeighbours = function(generation, row, col) {
        let neighbours = '';
        
        if (this.wraparound) {
            for (let i = -1; i < 2; i++) {
                for (let j = -1; j < 2; j++) {
                    let x = (row + i + this.rows) % this.rows;
                    let y = (col + j + this.cols) % this.cols;
                    
                    if (i !== 0 || j !== 0) {
                        if (generation[x][y] === -1) {
                            neighbours += '0';
                        }
                        else {
                            neighbours += generation[x][y].toString();
                        }
                    }
                }
            }
        }
        else {
            for (let i = -1; i < 2; i++) {
                for (let j = -1; j < 2; j++) {
                    let x = row + i;
                    let y = col + j;
                    
                    if (i !== 0 || j !== 0) {
                        if (x < 0 || y < 0 || x >= this.rows || y >= this.cols) {
                            neighbours += '0';
                        }
                        else if (generation[x][y] === -1) {
                            neighbours += '0';
                        }
                        else {
                            neighbours += generation[x][y].toString();
                        }
                    }
                }
            }
        }
    
        return neighbours;
    }

    this.isNeighbourAlive = function(neighbours, comparisonList, matching) {
        if (typeof(matching) === 'undefined') matching = 'loose';

        if (matching === 'exact') {
            let exactAlive = true;
            for (let i = 0; i < 8; i++) {
                if ((neighbours[i] === 0) && (comparisonList.indexOf((i+1).toString()) === -1)) continue;
                else if ((neighbours[i] !== 0) && (comparisonList.indexOf((i+1).toString()) !== -1)) continue;
                else exactAlive = false;
            }
            if (exactAlive) {
                return true;
            }

            return false;
        }
        else if (matching === 'loose') {
            for (let i = 0; i < comparisonList.length; i++) {
                let allAlive = true;
                for (let index = 0; index < comparisonList[i].length; index++) {
                    if (parseInt(neighbours[parseInt(comparisonList[i][index]) - 1]) !== 0) continue;
                    else allAlive = false;
                }
                if (allAlive) {
                    return true;
                }
            }
    
            return false;
        }
    }
    
    this.countNeighbours = function(neighbours, cellType) {
        if (typeof(cellType) === 'undefined') cellType = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
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
}

function isEmpty(obj) {
    for(var prop in obj) {
        if(obj.hasOwnProperty(prop))
            return false;
    }

    return true;
}