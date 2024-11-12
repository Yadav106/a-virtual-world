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
   * @param {Point} p1
   * @param {Point} p2
   */
  #moveInward(p1, p2, percent = 0.1) {
    const new_p1 = lerp2D(p1, p2, percent);
    const new_p2 = lerp2D(p2, p1, percent);
    p1.x = new_p1.x;
    p1.y = new_p1.y;
    p2.x = new_p2.x;
    p2.y = new_p2.y;
  }

  /**
   * @param {Polygon} poly
   */
  #extrudeCar(poly, height = 20, wheelRadius = 5) {
    const frontRight = new Point(
      poly.points[0].x,
      poly.points[0].y
    );

    const frontLeft = new Point(
      poly.points[1].x,
      poly.points[1].y
    );

    const backLeft = new Point(
      poly.points[2].x,
      poly.points[2].y
    );

    const backRight = new Point(
      poly.points[3].x,
      poly.points[3].y
    );

    const middleLeft = average(frontLeft, backLeft);
    const middleRight = average(frontRight, backRight);
    const quarterFrontLeft = average(frontLeft, middleLeft);
    const quarterBackLeft = average(backLeft, middleLeft);
    const quarterBackRight = average(backRight, middleRight);
    const quarterFrontRight = average(frontRight, middleRight);

    const base = new Polygon([
      frontLeft,
      quarterFrontLeft,
      middleLeft,
      quarterBackLeft,
      backLeft,
      backRight,
      quarterBackRight,
      middleRight,
      quarterFrontRight,
      frontRight
    ]);

    for (const point of base.points) {
      point.z -= wheelRadius; 
    }

    const ceiling = new Polygon(
      base.points.map(p => new Point(p.x, p.y, -height))
    );

    const midline = new Polygon(
      base.points.map(p => new Point(p.x, p.y, -height / 2))
    );

    const c_frontLeft = ceiling.points[0];
    const c_quarterFrontLeft = ceiling.points[1];
    const c_middleLeft = ceiling.points[2];
    const c_quarterBackLeft = ceiling.points[3];
    const c_backLeft = ceiling.points[4]
    const c_backRight = ceiling.points[5];
    const c_quarterBackRight = ceiling.points[6];
    const c_middleRight = ceiling.points[7];
    const c_quarterFrontRight = ceiling.points[8];
    const c_frontRight = ceiling.points[9];

    c_frontLeft.z += 5;
    c_frontRight.z += 5;
    c_quarterFrontLeft.z += 3;
    c_quarterFrontRight.z += 3;
    c_backLeft.z += 4;
    c_backRight.z += 4;

    this.#moveInward(c_frontLeft, c_frontRight);
    this.#moveInward(c_quarterFrontLeft, c_quarterFrontRight);
    this.#moveInward(c_middleLeft, c_middleRight);
    this.#moveInward(c_quarterBackLeft, c_quarterBackRight);
    this.#moveInward(c_backLeft, c_backRight);

    const sides = [];
    for (let i = 0; i < base.points.length; i++) {
      sides.push(new Polygon([
        base.points[i],
        base.points[(i+1) % base.points.length],
        midline.points[(i+1) % midline.points.length],
        midline.points[i]
      ]))
    }

    for (let i = 0; i < base.points.length; i++) {
      sides.push(new Polygon([
        midline.points[i],
        midline.points[(i+1) % midline.points.length],
        ceiling.points[(i+1) % ceiling.points.length],
        ceiling.points[i]
      ]))
    }

    const ceilingParts = [];

    ceilingParts.push(new Polygon([
      c_frontLeft,
      c_quarterFrontLeft,
      c_quarterFrontRight,
      c_frontRight
    ]));

    ceilingParts.push(new Polygon([
      c_quarterFrontLeft,
      c_middleLeft,
      c_middleRight,
      c_quarterFrontRight
    ]));

    ceilingParts.push(new Polygon([
      c_middleLeft,
      c_quarterBackLeft,
      c_quarterBackRight,
      c_middleRight
    ]));

    ceilingParts.push(new Polygon([
      c_quarterBackLeft,
      c_backLeft,
      c_backRight,
      c_quarterBackRight
    ]));

    const carAngle = Math.atan2(
      frontLeft.y - backLeft.y,
      frontLeft.x - backLeft.x
    );

    let frontWheelAngle = carAngle;
    if (carInfo.controls.tilt) {
       frontWheelAngle += carInfo.controls.tilt * 0.5;
    } else {
       if (carInfo.controls.left) {
          frontWheelAngle -= 0.3;
       }
       if (carInfo.controls.right) {
          frontWheelAngle += 0.3;
       }
    }

    const frontWheelLeftPolys = this.#generateWheel(
       quarterFrontLeft,
       wheelRadius,
       frontWheelAngle,
       carInfo.fittness
    );
    const frontWheelRightPolys = this.#generateWheel(
       quarterFrontRight,
       wheelRadius,
       frontWheelAngle,
       carInfo.fittness
    );
    const backWheelLeftPolys = this.#generateWheel(
       quarterBackLeft,
       wheelRadius,
       carAngle,
       carInfo.fittness
    );
    const backWheelRightPolys = this.#generateWheel(
       quarterBackRight,
       wheelRadius,
       carAngle,
       carInfo.fittness
    );

    return [
         ...frontWheelLeftPolys,
         ...frontWheelRightPolys,
         ...backWheelLeftPolys,
         ...backWheelRightPolys,
         ...sides, 
         ...ceilingParts
      ];
  }

  #generateWheel(center, radius, angle, distance = 0, thickness = 4) {
    const center1 = new Point(
      center.x + Math.cos(angle + Math.PI / 2) * thickness / 2,
      center.y + Math.sin(angle + Math.PI / 2) * thickness / 2,
      center.z
    );
    const center2 = new Point(
      center.x - Math.cos(angle + Math.PI / 2) * thickness / 2,
      center.y - Math.sin(angle + Math.PI / 2) * thickness / 2,
      center.z
    );

    const poly1 = this.#generateWheelSide(
      center1, radius, angle, distance
    );
    const poly2 = this.#generateWheelSide(
      center2, radius, angle, distance
    );

    const sides = [];
    for (let i = 0; i < poly1.points.length; i++) {
       sides.push(
          new Polygon([
             poly1.points[i],
             poly1.points[(i + 1) % poly1.points.length],
             poly2.points[(i + 1) % poly2.points.length],
             poly2.points[i]
          ])
       );
    }

      return [poly1, poly2, ...sides];
   }
    #generateWheelSide(center, radius, angle, distance) {
      const support = [
         center,
         new Point(
            center.x + Math.cos(angle) * radius,
            center.y + Math.sin(angle) * radius,
            center.z
         )
      ];
      const points = [];
      for (let a = 0; a < Math.PI * 2; a += Math.PI / 8) {
         const angle = a + distance / 20;
         points.push(
            new Point(
               lerp(support[0].x, support[1].x, Math.cos(angle)),
               lerp(support[0].y, support[1].y, Math.cos(angle)),
               center.z + Math.sin(angle) * radius
            )
         );
      }
      return new Polygon(points);
   }

  /**
  * @param {World} world
  */
  #getPolys(world) {
    const buildingPolys = this.#extrude(
      this.#filter(world.buildings.map(b => b.base)), 150
    );

    const carPolys = this.#extrudeCar(
      this.#filter( 
        [new Polygon(world.bestCar.polygon.map(p => new Point(p.x, p.y)))]
      )[0]
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
