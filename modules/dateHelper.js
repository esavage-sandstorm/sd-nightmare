const dateHelper = {

  months: ['Zero', 'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],

  getCurrent: function() {
    const d = new Date();
    const date = {};
    date.Y = d.getFullYear();
    date.M = d.getMonth()+1;
    date.D = d.getDate();
    date.h = d.getHours();
    date.i = d.getMinutes();
    date.q = Math.ceil((date.M/12) * 4);
    date.time = (date.h > 12)? (date.h-12)+':'+date.i+' pm' : date.h+':'+date.i+' am';
    date.month = this.months[date.M];
    date.yq = date.Y+'Q'+date.q;
    date.ymd = date.Y+'-'+date.M+'-'+date.D;
    return date;
  }
}
module.exports = dateHelper;
