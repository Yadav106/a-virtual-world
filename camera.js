/**
  * @class A class to represent camera which moves in the virtual world
  */
class Camera {
  constructor({ x, y, angle }, range = 1000) {
    this.range = range;
    this.move({ x, y, angle });
  }

  move({ x, y, angle }) {
    this.x = x;
    this.y = y;
    this.z = -20;
    this.angle = angle;
    this.center = new Point(this.x, this.y);

    this.tip = new Point(
      this.x - this.range * Math.sin(this.angle),
      this.y - this.range * Math.cos(this.angle)
    );

    this.left = new Point(
      this.x - this.range * Math.sin(this.angle - Math.PI / 4),
      this.y - this.range * Math.cos(this.angle - Math.PI / 4)
    );

    this.right = new Point(
      this.x - this.range * Math.sin(this.angle + Math.PI / 4),
      this.y - this.range * Math.cos(this.angle + Math.PI / 4)
    );

    this.poly = new Polygon(
      [this.center, this.left, this.right]
    );
  }

  /**
   * @param {Point} p 
   */
  #projectPoint(ctx, p) {
    const seg = new Segment(this.center, this.tip);
    const { point: p1 } = seg.projectPoint(p);
    const c = cross(subtract(p1, this), subtract(p, this));
    const x = Math.sign(c) * distance(p, p1) / distance(this, p1);
    const y = (p.z - this.z) / distance(this, p1);

    const cX = ctx.canvas.width / 2;
    const cY = ctx.canvas.height / 2;
    const scaler = Math.max(cX, cY);
    
    return new Point(cX + x * scaler, cY + y * scaler);
  }

  /**
   * @param {Polygon[]} polys
   */
  #filter(polys) {
    const filteredPolys = [];

    for (const poly of polys) {
      if (poly.intersectsPoly(this.poly)) {
        const copy1 = new Polygon(poly.points);
        const copy2 = new Polygon(this.poly.points);
        Polygon.break(copy1, copy2, true);
        const points = copy1.segments.map(s => s.p1);
        const filteredPoints = points.filter(
          p => p.intersection || this.poly.containsPoint(p)
        );
        filteredPolys.push(new Polygon(filteredPoints));
      } else if (this.poly.containsPoly(poly)) {
        filteredPolys.push(poly);
      }
    }

    return filteredPolys;
  }

  /**
   * @param {Polygon[]} polys
   */
  #extrude(polys, height = 10) {
    const extrudedPolys = [];

    for (const poly of polys) {
      const ceiling = new Polygon(
        poly.points.map(p => new Point(p.x, p.y, -height))
      );

      const sides = [];
      for (let i = 0; i < poly.points.length; i++) {
        sides.push(new Polygon([
          poly.points[i],
          poly.points[(i+1) % poly.points.length],
          ceiling.points[(i+1) % ceiling.points.length],
          ceiling.points[i]
        ]))
      }

      extrudedPolys.push(...sides, ceiling);
    }

    return extrudedPolys;
  }

  /**
  * @param {World} world
  */
  #getPolys(world) {
    const buildingPolys = this.#extrude(
      this.#filter(world.buildings.map(b => b.base)), 150
    );

    const carPolys = this.#extrude(
      this.#filter(world.cars.map(c => 
        new Polygon(c.polygon.map(p => new Point(p.x, p.y)))
      )),
      10
    );

    const roadPolys = this.#extrude(
      this.#filter(world.corridor.borders.map(s =>
        new Polygon([s.p1, s.p2])
      )),
      10
    )

    return [...buildingPolys, ...carPolys, ...roadPolys];
  }

  /**
  * @param {World} world
  */
  render(ctx, world) {
    const polys = this.#getPolys(world)

    const projPolys = polys.map(
      poly => new Polygon(
        poly.points.map(p => this.#projectPoint(ctx, p))
      )
    );

    ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

    for (const poly of projPolys) {
      poly.draw(ctx);
    }
  }

  draw(ctx) {
    this.poly.draw(ctx);
  }
}
