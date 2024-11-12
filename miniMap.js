class MiniMap {
  /**
   * Represents a Mini Map
 * @param {Graph} graph - An instance of the Graph class.
 * @param {HTMLCanvasElement} canvas 
 * @param {Car[]} cars 
 * @class
 */
  constructor(canvas, graph, size, cars) {
    this.canvas = canvas;
    this.graph = graph;
    this.size = size;
    this.cars = cars;

    canvas.width = size;
    canvas.width = size;
    this.ctx = canvas.getContext("2d");
  }

  /**
  * @param {Point} viewPoint 
  */
  update(viewPoint) {
    this.ctx.clearRect(0, 0, this.size, this.size);

    const scaler = 0.1;
    /**
      * @type {Point}
      */
    const scaledViewPoint = scale(viewPoint, -scaler);
    this.ctx.save();
    this.ctx.translate(
      scaledViewPoint.x + this.size / 2,  
      scaledViewPoint.y + this.size / 2
    );
    this.ctx.scale(scaler, scaler);
    for (const seg of this.graph.segments) {
      seg.draw(this.ctx, { width: 3 / scaler, color: "white" });
    }

    for (const c of this.cars) {
      this.ctx.beginPath();
      this.ctx.fillStyle = "gray";
      this.ctx.lineWidth = 2 / scaler;
      this.ctx.arc(c.x, c.y, 5 / scaler, 0, Math.PI*2);
      this.ctx.fill();
      this.ctx.stroke();
    }

    this.ctx.restore();
    new Point(this.size / 2, this.size / 2)
      .draw(this.ctx, { color: "blue", outline: true });
  }
}
