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

  CIRCLE : 360,
  HALF_A_CIRCLE : 180,
  RIGHT_ANGLE : 90,

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
      this.addEvent('complete',this.normalizeDegree.bind(this));
    }
  },

  start : function(from,to) {
    if(to == null) {
      to = from;
      from = this.getCurrentRotation();
    }
    this.degreeFrom = from.toInt();
    this.degreeTo = to.toInt();
    this.parent(this.degreeFrom,this.degreeTo);
  },

  getCurrentRotation : function() {

    var rotation;

    if(this.transforms) {

      //this is required to find the full css style for the element (style and css)

      var style;
      if(Browser.ie) {
        style = (this.element.style['transform'] || '') + ' ' +
                (this.element.style['-ms-transform'] || '') + ' ' +
                (this.element.currentStyle['transform'] || '') + ' ' +
                (this.element.currentStyle['-ms-transform'] || '') + ' ';
      }
      else {
        var accessor = this.accessor;
        if(!Browser.firefox) {
          accessor = Browser.vendorPrefix+'transform';
        }

        //get the full style ... in order of css3 style, css3 vendor style, css3 stylesheet, css3 vendor stylesheet
        style = (this.element.style['transform'] || '') + ' ' +
                (this.element.style[this.accessor] || '') + ' ' +
                (document.defaultView.getComputedStyle(this.element,null).getPropertyValue('transform') || '') +
                (document.defaultView.getComputedStyle(this.element,null).getPropertyValue(accessor) || '');
      }

      style = style.trim();
      if(style.length > 0) {
        var rotateResults = style.match(/rotate\((\d+).*?\)/);
        if(rotateResults && rotateResults.length > 1) {
          rotation = rotateResults && rotateResults.length > 1 ? rotateResults[1] : 0;
        }
        else { 
          // this will return the default value based off the transform using the inverse of cos
          var matrixResults = style.match(/matrix\((.+?),.+?\)/);
          if(matrixResults && matrixResults.length > 1) {
            var costheta = matrixResults[1];
            var cos = Math.acos(costheta);
            var deg = Math.round((cos * this.HALF_A_CIRCLE) / Math.PI);
            rotation = deg && deg != 0 ? deg : 0;
          }
        }
      }
    }

    if(rotation == null && Browser.ie && this.element.filters && this.element.filters.length > 0) { //ie
      var isMatrix, isBasic;
      for(var i in this.element.filters) {
        if(i == 'DXImageTransform.Microsoft.BasicImage') {
          isRotation = true;
          break;
        }
        if(i == 'DXImageTransform.Microsoft.Matrix') {
          isMatrix = true;
          break;
        }
      }

      if(isBasic) {
        var basic = this.element.filters('DXImageTransform.Microsoft.BasicImage');
        if(basic && basic.Rotation!=null) {
          rotation = Math.round(basic.Rotation * this.RIGHT_ANGLE);
        }
        this.element.filters(0).enabled = 0;
      }
      else if(isMatrix) {
        var matrix = this.element.filters('DXImageTransform.Microsoft.Matrix');
        matrix.SizingMethod = 'auto expand';
        if(matrix && matrix.M11) {
          var costheta = matrix.M11;
          var cos = Math.acos(costheta);
          var deg = Math.round((cos * this.HALF_A_CIRCLE) / Math.PI);
          rotation = deg && deg != 0 ? deg : 0;
        }
      }
    }

    return rotation || 0;
  },

  normalize : function(skip) {
    (skip ? this.set : this.start).apply(this,[0]);
  },

  normalizeDegree : function() {
    var fin = this.degreeTo % this.CIRCLE;
    this.set(fin);
  },

  _setIEMethod : function() {

    //the element needs to have the boolean enabled : hasLayout (zoom does this)
    this.element.style.zoom = "1";
    this.deg2radians = Math.PI / this.HALF_A_CIRCLE;

    //normalize the rotation for ie
    var rotation = this.getCurrentRotation();

    //setup the first matrix values so that it won't flicker
    var rad = this.deg2radians * rotation;
    costheta = Math.cos(rad);
    sintheta = Math.sin(rad);
    this.element.style.filter = "progid:DXImageTransform.Microsoft.Matrix(sizingMethod='auto expand',M11="+costheta+", M12="+sintheta+", M21="+(0-sintheta)+", M22="+costheta+")";
    this.set(rotation);

    //setup the function for rotation for ie
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

  rotate : function(fromOrTo,toOrSkip) {
    var rotate = $(this).get('rotate');
    if(toOrSkip === true) {
      rotate.set(fromOrTo);
    }
    else {
      rotate.start(fromOrTo,toOrSkip);
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
