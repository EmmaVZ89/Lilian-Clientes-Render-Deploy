import { Cliente } from "./cliente.js";

export default function createTable(array) {
  array.sort(function (a, b) {
    return a.nombre.localeCompare(b.nombre);
  });

  const $table = document.createElement("table");
  $table.appendChild(createThead());
  $table.appendChild(createTbody(array));

  $table.classList.add("table", "table-bordered");
  $table.setAttribute("id", "tablaClientes");
  return $table;
}

function createThead() {
  const obj = new Cliente();
  const $thead = document.createElement("thead");
  const $tr = document.createElement("tr");
  $tr.classList.add("th-table");
  $tr.setAttribute("id", "th-table");
  for (const key in obj) {
    if (key === "nombre" || key === "apellido" || key === "telefono") {
      const $th = document.createElement("th");
      const $text = document.createTextNode(key.toUpperCase());
      $th.appendChild($text);
      $tr.appendChild($th);
    }
  }
  $thead.appendChild($tr);
  return $thead;
}

function createTbody(array) {
  const $tbody = document.createElement("tbody");

  if (array.length === 0) {
    const $tr = document.createElement("tr");
    for (let i = 0; i < 3; i++) {
      const $td = document.createElement("td");
      const $text = document.createTextNode("----------");
      $td.appendChild($text);
      $tr.appendChild($td);
    }
    $tbody.appendChild($tr);
  } else {
    array.forEach((element) => {
      const $tr = document.createElement("tr");
      $tr.classList.add("tr-table");
      for (const key in element) {
        if (key === "id") {
          $tr.setAttribute("data-id", element[key]);
        }
        if (key === "nombre" || key == "apellido") {
          const $td = document.createElement("td");
          let $text = "";
          if (element[key] == "") {
            $text = document.createTextNode("");
          } else {
            $text = document.createTextNode(
              element[key][0].toUpperCase() + element[key].slice(1).toLowerCase()
            );
          }
          $td.appendChild($text);
          $tr.appendChild($td);
        } else if (key == "telefono") {
          const $td = document.createElement("td");
          const $text = document.createTextNode(element[key]);
          $td.appendChild($text);
          $tr.appendChild($td);
        }
      }
      $tbody.appendChild($tr);
    });
  }
  return $tbody;
}
