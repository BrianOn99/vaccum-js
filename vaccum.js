
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

    // draw shapes
    var r = this.radius;
    this.ctx.fillStyle = this.radgrad;
    this.ctx.fillRect(-r,-r,r*2,r*2);
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
        var radgrad = this.ctx.createRadialGradient(0,0,(this.radius*0.1), 0,0,this.radius);
        radgrad.addColorStop(0, this.centerColor);
        radgrad.addColorStop(0.3, this.mainColor);
        radgrad.addColorStop(1, 'rgba(0,0,0,0)');
        this.radgrad = radgrad;
    }
    gen.prototype = proto;
    return gen;
};

/*
 * Particle Group
 */
Pgroup = function(theta, startPt, scale, left, center, right) {
    this.theta = theta;
    this.startPt = startPt;
    this.left = left;
    this.center = center;
    this.right = right;
    this.scale = scale;
    this.age = 0;
    this.velocity = 25;
    this.birthTime = (new Date()).getTime()/1000;
}

Pgroup.prototype = {
    bias: function() {
        // a quadratic equation y = (t+1)**2 - 1
        return (1 - Math.pow(((this.age*2/this.maxage)-1),2));
    },

    maxage: 2,

    alphaByAge: function() {
        var distToHell = Math.min(this.maxage - this.age, this.age);
        return Math.abs(Math.min(distToHell*4, 1));
    },

    draw: function(now) {
        this.age = now - this.birthTime;
        var centerDisp = new Displacement(this.age * this.velocity, 0);
        var bias = this.bias() * this.age * this.velocity;
        this.prepareDraw();
        this.center.draw(centerDisp.rotate(this.theta));
        this.left.draw(centerDisp.add(new Displacement(0,bias)).rotate(this.theta));
        this.right.draw(centerDisp.add(new Displacement(0,-bias)).rotate(this.theta));
        this.endDraw();
    },

    prepareDraw: function() {
        this.ctx.save();
        this.ctx.translate(this.startPt.x, this.startPt.y);
        this.ctx.scale(this.scale, this.scale);
        this.ctx.globalAlpha = this.alphaByAge();
    },
    endDraw:  function(loc) {
        this.ctx.restore();
    }
}

function inverseExpDist(mean) {
    return -mean * Math.log(1-Math.random());
}

function Drawer() {
    this.canvas = document.getElementById('vaccum-space');
    var ctx = this.canvas.getContext('2d');
    this.ctx = ctx;
    this.pgroupList = [];
    this.now = 0;
    this.nextTime = 0;
    this.i = 0;
    CustPgroup = function(theta, startPt, scale, left, center, right) {
        Pgroup.call(this, theta, startPt, scale, left, center, right);
        this.ctx = ctx;
    }
    CustPgroup.prototype = Object.create(Pgroup.prototype);

    this.canvas.style.backgroundColor = 'black';


    var particleFactory = particleTypeFactory(basicParticle, this.ctx);
    electron = new particleFactory('rgba(235,235,235,255)', 'rgba(0,200,255,255)');
    antiElectron = new particleFactory('rgba(0,100,150,255)', 'rgba(0,200,255,255)');
    photon = new particleFactory('rgba(255,255,230,255)', 'rgba(200,200,100,250)', 12);

    this.tryGenGroup = function() {
        if (this.nextTime - this.now <= 0) {
            this.addGroup();
            var interval = Math.min(7, inverseExpDist(CustPgroup.prototype.maxage/1.5));
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
            this.pgroupList.push(new CustPgroup(theta, new Point(x, y), Math.random()*0.75+0.25, electron, photon, antiElectron)):
            this.pgroupList.push(new CustPgroup(theta, new Point(x, y), Math.random()*0.75+0.25, antiElectron, photon, electron));
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
                grp.draw(this.now);
            }
        }

        var drawer = this;
        window.requestAnimationFrame(function() {drawer.play()});
    };
}

window.addEventListener("load", function() {
    (new Drawer()).play();
});
