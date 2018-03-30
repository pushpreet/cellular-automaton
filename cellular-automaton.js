function CellularAutomaton(rows, cols, ruleset, wraparound) {
    if (typeof(rows) === 'undefined') rows = 10;
    if (typeof(cols) === 'undefined') cols = 10;
    if (typeof(ruleset) === 'undefined') ruleset = 'game-of-life';
    if (typeof(wraparound) === 'undefined') wraparound = true;

    this.rows = rows;
    this.cols = cols;
    this.ruleset = ruleset;
    this.wraparound = wraparound;

    this.generations = [];

    this.rulesets = [
        'game-of-life',
        'simple-office-residence',
        'sheet-000',
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

    this.reset = function() {
        this.generations = [this.generations[0]]
    }

    this.setInitialGeneration = function(generation) {
        if (typeof(generation) === 'undefined') generation = 'random';

        let initialGeneration = this.make2DArray();

        if (generation === 'random') {
            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    initialGeneration[row][col] = Math.floor(Math.random(2) * 2);
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
        switch (ruleSet) {
            case 'game-of-life': {
                let state = generation[row][col];
                let sumNeighbours = this.countNeighbours(this.getNeighbours(generation, row, col));
    
                if (state === 0 && sumNeighbours === 3) {
                    return 1;
                } else if (state > 0 && (sumNeighbours < 2 || sumNeighbours > 3)) {
                    return 0;
                } else {
                    return state;
                }
    
                break;
            }

            case 'crooked-game-of-life': {
                let state = generation[row][col];
                let sumNeighbours = this.countNeighbours(this.getNeighbours(generation, row, col));
    
                if (state === 0 && sumNeighbours === 4) {
                    return 1;
                } else if (state > 0 && (sumNeighbours < 3 || sumNeighbours > 4)) {
                    return 0;
                } else {
                    return state;
                }
    
                break;
            }
    
            case 'simple-office-residence': {
                let state = generation[row][col];
                let neighbours = this.getNeighbours(generation, row, col);
    
                if (this.generations.length < 8) {
                    if (state === 5) {
                        return 5;
                    }
                    else {
                        let sumNeighbours = this.countNeighbours(neighbours, [4, 5])
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
                    if ((neighbours[0] === '5') && (neighbours[1] === '5') && (neighbours[3] == '5') || (state === 3)) {
                        return 3;
                    }
                    else {
                        let sumNeighbours = this.countNeighbours(neighbours, [2, 3, 4, 5])
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

            case 'sheet-000': {
                let state = generation[row][col];
                let neighbours = this.getNeighbours(generation, row, col);

                let born = [
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

                let dead = [
                    '1368', 
                    '36', '18',
                    '1358', '1346', '1678', '3678', '1236', '3568', '1238', '1568',
                    '128', '236', '148', '356', '178', '367', '158', '346',
                    '134', '468', '378', '238', '126', '568', '135', '167',
                    '2356', '1248', '3467', '1578'];

                if (state === 0 && this.isNeighbourAlive(neighbours, born))
                    return 1;
                else if (state !== 0 && this.isNeighbourAlive(neighbours, dead))
                    return 0;
                else
                    return state;

                break;
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
                            neighbours += generation[x][y].toString();
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
                        else {
                            neighbours += generation[x][y].toString();
                        }
                    }
                }
            }            
        }
    
        return neighbours;
    }

    this.isNeighbourAlive = function(neighbours, comparisonList) {
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