function CellularAutomaton(rows, cols, wraparound) {
    if (typeof(rows) === 'undefined') rows = 10;
    if (typeof(cols) === 'undefined') cols = 10;
    if (typeof(wraparound) === 'undefined') wraparound = true;

    this.rows = rows;
    this.cols = cols;
    this.wraparound = wraparound;

    this.generations = [];

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
                nextGeneration[row][col] = this.applyRules('simple-office-residence', lastGeneration, row, col);
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
                } else if (state === 1 && (sumNeighbours < 2 || sumNeighbours > 3)) {
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
    
    
    this.countNeighbours = function(neighbours, cellType) {
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
}