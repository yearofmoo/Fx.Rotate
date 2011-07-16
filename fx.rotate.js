(function($,$$) {

//IE 10 detection
Browser.ie10 = Browser.ie && !Browser.ie9 && navigator.userAgent.test(/Trident\/6\.0/);

//each browser has it own vendor prefix
if(Browser.chrome || Browser.safari) {
  Browser.vendorPrefix = '-webkit-';
}
else if(Browser.firefox) {
  Browser.vendorPrefix = '-moz-';
}
else if(Browser.opera) {
  Browser.vendorPrefix = '-o-';
}
else if(Browser.ie10 || Browser.ie9 || Browser.ie8) {
  Browser.vendorPrefix = '-ms-';
}
else {
  Browser.vendorPrefix = '';
}

Fx.Rotate = new Class({

  Extends : Fx,

  options : {
    ieFps : 40,
    origin : 'center center',
    normalizeDegreeAfterComplete : true
  },

  initialize : function(element,options) {
    this.prefix = Browser.vendorPrefix;
    this.transforms = !Browser.ie || Browser.ie9 || Browser.ie10;
    this.element = $(element);
    this.accessor = '';

    this.parent(options);
    if(this.transforms) {
      var accessor = this.prefix.replace(/-/g,'');

      //all other browsers like the uppercase start value
      if(!Browser.ie9 && !Browser.ie10) {
        accessor = accessor.charAt(0).toUpperCase() + accessor.substr(1);
      }

      this.accessor = accessor + 'Transform';

      //set the default origin
      var accessorOrigin = accessor + 'TransformOrigin';
      this.element.style[accessorOrigin] = this.options.origin;

      //set the rotation method
      this.set = this._setTransformMethod();
    }
    else {
      this.options.fps = this.options.ieFps || this.options.fps;
      this.set = this._setIEMethod();
    }

    if(this.options.normalizeDegreeAfterComplete) {
      this.addEvent('complete',this.normalizeDegree);
    }
  },

  start : function(from,to) {
    if(to == null) {
      to = from;
      from = this.getCurrentRotation();
    }
    this.degreeFrom = from;
    this.degreeTo = to;
    this.parent(from,to);
  },

  getCurrentRotation : function() {
    var rotation = 0;
    if(this.transforms) {
      var prefix = Browser.vendorPrefix;
      var matches = (this.element.style[this.accessor] || '').toString().match(/rotate\((\d+).*?\)/);
      rotation = matches && matches.length > 1 ? matches[1] : 0;
    }
    return rotation;
  },

  normalize : function(skip) {
    (skip ? this.set : this.start)(0);
  },

  normalizeDegree : function() {
    var CIRCLE = 360;
    var fin = this.degreeTo % CIRCLE;
    this.set(fin);
  },

  _setIEMethod : function() {
    this.deg2radians = Math.PI * 2 / 360;
    this.element.style.filter = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand',M11=1, M12=-1, M21=-1, M22=1)"
    return function(rotation) {
      var rad = this.deg2radians * rotation;
      costheta = Math.cos(rad);
      sintheta = Math.sin(rad);
      this.element.filters(0).M11 = costheta;
      this.element.filters(0).M12 = -sintheta;
      this.element.filters(0).M21 = sintheta;
      this.element.filters(0).M22 = costheta;
    }.bind(this);
  },

  _setTransformMethod : function() {
    var prefix = Browser.vendorPrefix;
    return function(rotation) {
      this.element.style[this.accessor] = 'rotate('+rotation+'deg)';
    }.bind(this);
  }

});

Element.implement({

  rotate : function(from,toOrSkip) {
    var rotate = $(this).get('rotate');
    if(toOrSkip === true) {
      rotate.set(from);
    }
    else {
      rotate.start(from,toOrSkip);
    }
    return rotate;
  },

  normalize : function(skip) {
    var rotate = $(this).get('rotate');
    rotate.normalize(skip);
    return rotate;
  }

});

Element.Properties.rotate = {

  get : function() {
    var rotate = $(this).retrieve('Fx.Rotate');
    if(!rotate) {
      rotate = this.set('rotate',{});
    }
    return rotate;
  },

  set : function(options) {
    var rotate = new Fx.Rotate(this,options);
    this.store('Fx.Rotate',rotate);
    return rotate;
  }

};


})(document.id,$$);
