/**
  * @class A class to represent camera which moves in the virtual world
  */
class Camera {
  constructor({ x, y, angle }, range = 1000, distanceBehind = 90) {
    this.range = range;
    this.distanceBehind = distanceBehind;
    this.moveSimple({ x, y, angle });
  }

  move({ x, y, angle }) {
    const t = 0.1;
    this.x = lerp(this.x, x + this.distanceBehind * Math.sin(angle), t);
    this.y = lerp(this.y, y + this.distanceBehind * Math.cos(angle), t);
    this.z = -20 - 10;
    this.angle = lerp(this.angle, angle, t);
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


  moveSimple({ x, y, angle }) {
    this.x = x + this.distanceBehind * Math.sin(angle);
    this.y = y + this.distanceBehind * Math.cos(angle);
    this.z = -20 - 10;
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
      this.#filter( 
        [new Polygon(world.bestCar.polygon.map(p => new Point(p.x, p.y)))]
      ),
      10
    );

    const carShadows = this.#filter(
      world.cars.map(
        c => new Polygon(c.polygon.map(p => new Point(p.x, p.y)))
      )
    );

    const roadPolys = this.#extrude(
      this.#filter(world.corridor.borders.map(s =>
        new Polygon([s.p1, s.p2])
      )),
      10
    )

    for (const poly of carShadows) {
      poly.fill = "rgba(150,150,150,1)";
      poly.stroke = "rgba(0,0,0,0)";
    }

    for (const poly of buildingPolys) {
      poly.fill = "rgba(150,150,150,0.2)";
      poly.stroke = "rgba(150,150,150,0.2)";
    }

    return [...carShadows, ...buildingPolys, ...carPolys, ...roadPolys];
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

    for (let i = 0; i < projPolys.length; i++) {
      const { fill, stroke } = polys[i];
      projPolys[i].draw(ctx, { fill, stroke });
    }
  }

  draw(ctx) {
    this.poly.draw(ctx);
  }
}
