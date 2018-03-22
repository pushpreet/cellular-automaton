function Automation(rows, cols) {
    this.rows = rows;
    this.cols = cols;
    this.generations = [];

    this.make2DArray = function() {
        let arr = new Array(this.rows);
        for (let row = 0; row < arr.length; row++) {
            arr[row] = new Array(this.cols);
        }

        return arr;
    }

    this.setInitialGeneration = function(generation) {
        if (typeof(generation) === 'undefined') generation = 'random';

        if (generation == 'random') {
            this.generations = [];
            let initialGeneration = make2DArray();

            for (let row = 0; row < this.rows; row++) {
                for (let col = 0; col < this.cols; col++) {
                    initialGeneration[row][col] = floor(Math.random(2) * 2);
                }
            }
        }
    }
}