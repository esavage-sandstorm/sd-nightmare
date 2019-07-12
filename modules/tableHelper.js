function tableHelper(id) {
  const table = this;

  table.headers = [];
  table.rows = [];
  table.id = id;

  table.addRow = function(row){
    table.rows.push(row);
  }
  table.addHeader = function(header){
    table.headers.push(header);
  }

  table.html = function(){
    table.width = table.headers.length;
    table.rows.forEach(row => {
      table.width = Math.max(table.width, row.length);
    });
    let html = '<table border="1" style="border-collapse: collapse;margin:1em 0;"';
    html += (table.id)? ' id="'+table.id+'">' : '>';
    if (table.headers.length > 0){
      html +='<thead>';
      html += '<tr>';
      table.headers.forEach((header, i) => {
        if (i+1 < table.headers.length){
          html +='<th style="border: 1px solid #000;padding: 0 1em;">'+header+'</th>';
        }else {
          html +='<th style="border: 1px solid #000;padding: 0 1em;" colspan="'+(table.width - table.headers.length)+'">'+header+'</th>';
        }
      });
      html += '</tr>';
      html += '</thead>';
    }
    html +='<tbody>';
    if (table.rows.length > 0){
      table.rows.forEach(row =>{
        html +='<tr>';
        row.forEach((cell, i) => {
          if (i+1 < row.length){
            html +='<td style="border: 1px solid #000;padding: 0 1em;">' + cell + '</td>';
          } else {
            html +='<td style="border: 1px solid #000;padding: 0 1em;" colspan="'+(table.width - row.length+1)+'">' + cell + '</td>';
          }
        });
        html +='</tr>';
      });
    }
    html += '</tbody>';
    html += '</table>';
    return html;
  }
}
module.exports = tableHelper;
