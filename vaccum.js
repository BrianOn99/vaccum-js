
/*
 * point
 */
Point = function(x,y) {
    this.x = x;
    this.y = y;
}
Point.prototype.add = function(disp) {
    return new Point(this.x + disp.x, this.y + disp.y);
}

Displacement = function(x,y) {
    this.x = x;
    this.y = y;
}
Displacement.prototype.add = function(disp) {
    return new Displacement(this.x + disp.x, this.y + disp.y);
}
Displacement.prototype.rotate = function(theta) {
    return new Displacement(
            Math.cos(theta)*this.x - Math.sin(theta)*this.y,
            Math.sin(theta)*this.x + Math.cos(theta)*this.y
            );
}

/*
 * Particles
 */
basicParticle = {
    centerColor: 'rgba(255,255,255,255)',
    mainColor: 'rgba(0,200,255,255)',
    radius: 25
};

basicParticle.ctx = "to_be_overidden";
basicParticle.draw = function(loc) {
    this.ctx.save();
    this.ctx.translate(loc.x,loc.y);
    var radius = this.radius;
    var radgrad = this.ctx.createRadialGradient(0,0,(radius*0.1), 0,0,radius);
    radgrad.addColorStop(0, this.centerColor);
    radgrad.addColorStop(0.3, this.mainColor);
    radgrad.addColorStop(1, 'rgba(0,0,0,0)');

    // draw shapes
    this.ctx.fillStyle = radgrad;
    this.ctx.fillRect(-radius,-radius,radius*2,radius*2);
    this.ctx.restore();
}

particleTypeFactory = function(proto, ctx) {
    var gen = function(centerColor, mainColor, radius) {
        this.centerColor = centerColor;
        this.mainColor = mainColor;
        this.ctx = ctx;
        if (radius) {
            this.radius = radius;
        }
    }
    gen.prototype = proto;
    return gen;
};

function inverseExpDist(mean) {
    return -mean * Math.log2(1-Math.random());
}

function Drawer() {
    this.canvas = document.getElementById('vaccum-space');
    this.ctx = this.canvas.getContext('2d');
    this.pgroupList = [];
    this.now = 0;
    this.nextTime = 0;
    this.i = 0;

    this.canvas.style.backgroundColor = 'black';

    /*
     * Particle Group
     */
    Pgroup = function(theta, startPt, left, center, right) {
        this.theta = theta;
        this.startPt = startPt;
        this.left = left;
        this.center = center;
        this.right = right;
        this.age = 0;
        this.velocity = 25;
        this.scale = 1;
        date = new Date();
        this.birthTime = date.getTime()/1000;
    }

    Pgroup.prototype = {
        bias : function() {
            // a quadratic equation y = (t+1)**2 - 1
            return (1 - Math.pow(((this.age*2/this.maxage)-1),2));
        },

        drawer: this,
        maxage : 2,

        draw : function() {
            this.age = this.drawer.now - this.birthTime;
            var centerDisp = new Displacement(this.age * this.velocity, 0);
            var bias = this.bias() * this.age * this.velocity;
            this.center.draw(this.startPt.add(centerDisp.rotate(this.theta)));
            this.left.draw(this.startPt.add(centerDisp.add(new Displacement(0,bias)).rotate(this.theta)));
            this.right.draw(this.startPt.add(centerDisp.add(new Displacement(0,-bias)).rotate(this.theta)));
        }
    }

    var particleFactory = particleTypeFactory(basicParticle, this.ctx);
    electron = new particleFactory('rgba(235,235,235,255)', 'rgba(0,200,255,255)');
    antiElectron = new particleFactory('rgba(0,100,150,255)', 'rgba(0,200,255,255)');
    photon = new particleFactory('rgba(255,255,230,255)', 'rgba(200,200,100,250)', 12);

    console.log("init");

    this.tryGenGroup = function() {
        if (this.i % 100 == 0) {
            console.log("frame next time" + (this.nextTime - this.now));
        }
        if (this.nextTime - this.now <= 0) {
            this.addGroup();
            var interval = Math.min(7, inverseExpDist(Pgroup.prototype.maxage/2));
            this.nextTime = interval + this.now;
            console.log("next time: " + (interval));
        }
    }

    this.addGroup = function() {
        console.log("adding group");
        theta = Math.random() * 2 * Math.PI;
        x = Math.random() * this.canvas.width;
        y = Math.random() * this.canvas.height;
        Math.random() > 0.5 ?
            this.pgroupList.push(new Pgroup(theta, new Point(x, y), electron, photon, antiElectron)):
            this.pgroupList.push(new Pgroup(theta, new Point(x, y), antiElectron, photon, electron));
    }

    this.play = function() {
        this.i = this.i + 1;
        if (this.i % 100 == 0) {
            console.log(this.i + " frame");
        }

        this.ctx.clearRect(0,0,300,300);

        date = new Date();
        this.now = date.getTime()/1000;

        this.tryGenGroup();
        for (var i in this.pgroupList) {
            var grp = this.pgroupList[i];
            if (grp.age >= grp.maxage) {
                this.pgroupList.splice(i, 1);
            } else {
                grp.draw();
            }
        }

        var drawer = this;
        next = function() {drawer.play()};
        window.requestAnimationFrame(next);
    };
}

window.addEventListener("load", function() {
    (new Drawer()).play();
});
