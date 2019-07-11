const stringHelper = {
  capitalize: function(str){
    return str.charAt(0).toUpperCase() + str.slice(1);
  },
  padBoth(str, char, l){
    if (str.length < l){
      const h = Math.floor((l - str.length)/2);
      str.padStart(h, char);
      while(str.length < l){
        str += char;
      }
    }
    return str;
  }
}
module.exports = stringHelper;
