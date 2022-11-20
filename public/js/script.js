import { Cliente, Ficha } from "./cliente.js";
import createTable from "./tabla.js";
import { updateControlList, activateControlFields, dateFormat } from "./listaControles.js";

const URL = "https://lilian-clientes.herokuapp.com/";

let animateX = document.querySelectorAll(".animated-scroll-right");
animateX[0].style.opacity = 1;
animateX[0].classList.add("view-from-right");

VerificarJWT();

const $divSpinner = document.getElementById("spinner");

let listaClientes = await getClientes();
let listaFichas = await getFichas();

const $divTable = document.querySelector(".contenedorTabla");
updateTable();

const actualDate = new Date();
const date = document.querySelector("#txtFecha");
date.value = actualDate.toJSON().slice(0, 10);

const $formularioCRUD = document.forms[0];
const $formularioControl = document.forms[1];

let fichas = [];
const $ulControl = document.querySelector("#listaControles");
const $btnControlCancel = document.querySelector("#btn-controles-cancel");

let cliente;
const $tituloCrud = document.querySelector("#modalTitle");
const $btnForm = document.querySelector("#btn-form");
const $btnFormCancel = document.querySelector("#btn-form-cancel");
const $btnCrear = document.querySelector("#btn-crear");
const $btnModificar = document.querySelector("#btn-modificar");
const $btnDelete = document.querySelector("#btn-eliminar");
const $btnFicha = document.querySelector("#btn-ficha");
$btnModificar.disabled = true;
$btnDelete.disabled = true;
$btnFicha.disabled = true;

// Buscador
const $btnBuscar = document.querySelector("#btn-buscar");
const $btnReset = document.querySelector("#btn-resetLista");

// Logout
const $btnLogOut = document.querySelector("#btn-logout");
$btnLogOut.addEventListener("click", () => {
  logOut();
});
// EVENTOS BOTONES -----------------------------------------------------------------------------------
$btnBuscar.addEventListener("click", () => {
  let nombreBusqueda = document.querySelector("#txtNombreBusqueda").value;
  let apellidoBusqueda = document.querySelector("#txtApellidoBusqueda").value;
  nombreBusqueda = nombreBusqueda.trim().toLowerCase();
  apellidoBusqueda = apellidoBusqueda.trim().toLowerCase();
  let arrayFiltrado = [];

  if (nombreBusqueda !== "" && apellidoBusqueda !== "") {
    arrayFiltrado = searchByNameAndLastName(listaClientes, nombreBusqueda, apellidoBusqueda);
  } else if (apellidoBusqueda == "") {
    arrayFiltrado = searchByName(listaClientes, nombreBusqueda);
  } else if (nombreBusqueda == "") {
    arrayFiltrado = searchByLastName(listaClientes, apellidoBusqueda);
  }

  if (arrayFiltrado.length == 0) {
    swal("¡ No hallado !", `No se hallaron coincidencias.`, "error");
  } else {
    updateTableBuscador(arrayFiltrado);
    swal("¡ Hallado !", `Se hallaron coincidencias.`, "success");
  }
});

$btnReset.addEventListener("click", () => {
  updateTable(listaClientes);
  swal("¡ Cargados !", `Se cargaron todos los clientes.`, "success");
});

$btnCrear.addEventListener("click", () => {
  resetForm();
  enableInputsCrud();
  if (!$btnForm.classList.contains("btn-primary")) {
    $btnForm.classList.add("btn-primary");
  }
  $tituloCrud.innerText = "Alta de Cliente";
  $("#miModal").modal("show");
});

$btnModificar.addEventListener("click", () => {
  enableInputsCrud();
  $btnForm.innerText = "Modificar";
  $btnForm.classList.remove("btn-primary");
  $btnForm.classList.add("btn-success");
  $tituloCrud.innerText = "Modificación de Cliente";
  $("#miModal").modal("show");
});

$btnDelete.addEventListener("click", () => {
  disableInputsCrud();
  $btnForm.innerText = "Eliminar";
  $btnForm.classList.remove("btn-primary");
  $btnForm.classList.add("btn-danger");
  $tituloCrud.innerText = "Baja de Cliente";
  $("#miModal").modal("show");
});

$btnFormCancel.addEventListener("click", () => {
  resetForm();
  $("#miModal").modal("hide");
});

$btnFicha.addEventListener("click", () => {
  const {fecha} = $formularioControl;
  fecha.disabled = false;
  resetFormControls();
  document.querySelector("#dropdownMenuButton1").disabled = false;
  document.querySelector("#btn-controles-modificar").disabled = true;
  document.querySelector("#btn-controles-eliminar").disabled = true;
  $("#modalControles").modal("show");
});

$btnControlCancel.addEventListener("click", () => {
  $("#modalControles").modal("hide");
});
// EVENTOS BOTONES -----------------------------------------------------------------------------------

// EVENTOS PANTALLA Y FORMULARIOS --------------------------------------------------------------------
window.addEventListener("click", (e) => {
  if (e.target.matches("td")) {
    $btnModificar.disabled = false;
    $btnDelete.disabled = false;
    $btnFicha.disabled = false;
    let id = e.target.parentElement.dataset.id;
    cliente = listaClientes.find((c) => c.id == id);
    fichas = listaFichas.filter((ficha) => {
      return ficha.id == cliente.id;
    });
    cliente.ficha = fichas;
    uploadFormCRUD(cliente);
    uploadFormControl(cliente);
    swal("¡ Ficha cargada !", `Se cargo a ${cliente.nombre} con exito`, "success");
  }
});

$formularioCRUD.addEventListener("submit", (e) => {
  e.preventDefault();
  const { nombre, apellido, telefono, observacion, fecha, detalle } = $formularioCRUD;
  const ficha = new Ficha(0, fecha.value, detalle.value);

  if ($btnForm.innerHTML !== "Eliminar") {
    if ($btnForm.innerHTML === "Guardar") {
      fichas = [];
    }
    if (!fichas.length) {
      fichas.push(ficha);
    } else {
      fichas.shift();
      fichas.unshift(ficha);
    }
  }

  const clienteCRUD = new Cliente(
    0,
    0,
    nombre.value.trim().toLowerCase(),
    apellido.value.trim().toLowerCase(),
    telefono.value,
    observacion.value,
    fichas
  );

  if ($btnForm.innerHTML === "Guardar") {
    createCliente(clienteCRUD, ficha);
    listaFichas.push(ficha);
    swal("¡ Agregado !", `El cliente fue agregado`, "success");
  } else if ($btnForm.innerHTML === "Modificar") {
    swal({
      title: `¿Desea modificar a ${cliente.nombre}?`,
      text: `Una vez modificado NO es posible recuperar la información.`,
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        clienteCRUD.id = cliente.id;
        clienteCRUD.id_ficha = cliente.id_ficha;
        clienteCRUD.ficha[0].id = cliente.id_ficha;
        let index = listaClientes.findIndex((c) => c.id == clienteCRUD.id);
        let indexFicha = listaFichas.findIndex(
          (ficha) => ficha.id == clienteCRUD.id_ficha && ficha.fecha == clienteCRUD.ficha[0].fecha
        );
        listaFichas[indexFicha] = clienteCRUD.ficha[0];
        listaClientes[index] = clienteCRUD;
        updateCliente(clienteCRUD);
        swal("¡ Modificado !", `El cliente fue modificado`, "success");
      } else {
        swal("No se realizó ninguna modificación!");
      }
    });
  } else {
    swal({
      title: `¿Desea eliminar a ${cliente.nombre}?`,
      text: `Una vez eliminado NO es posible recuperar la información.`,
      icon: "warning",
      buttons: true,
      dangerMode: true,
    }).then((willDelete) => {
      if (willDelete) {
        deleteCliente(cliente.id);
        swal("¡ Eliminado !", `El cliente fue eliminado`, "success");
      } else {
        swal("No se eliminó ningún cliente!");
      }
    });
  }
  $("#miModal").modal("hide");
  fichas = [];
});

$formularioControl.addEventListener("submit", (e) => {
  e.preventDefault();
  const { fecha, detalle } = $formularioControl;

  const ficha = new Ficha(cliente.id, fecha.value, detalle.value);

  let idSubmitter = e.submitter.id;
  let index = cliente.ficha.findIndex((c) => c.fecha === fecha.value);

  if (idSubmitter === "btn-controles-agregar") {
    let fichaExist = listaFichas.findIndex((c) => c.id == cliente.id && c.fecha == ficha.fecha);
    if (fichaExist !== -1) {
      swal("¡ Ya existe la ficha !", "Verifica que la fecha sea distinta a una ficha ya existente.", "error");
    } else {
      cliente.ficha.push(ficha);
      listaFichas.push(ficha);
      createFicha(ficha);
      resetFormControls();
      swal("¡ Agregada !", "La ficha fue agregada", "success");
    }
  } else if (idSubmitter === "btn-controles-modificar") {
    if (index !== -1) {
      swal({
        title: `¿Seguro que quiere modificar la ficha del ${dateFormat(
          new Date(cliente.ficha[index].fecha + "T00:00:00")
        )}?`,
        text: "Una vez modificado no es posible recuperar la información.",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((willDelete) => {
        if (willDelete) {
          let indexFicha = listaFichas.findIndex((c) => c.id == ficha.id && c.fecha == ficha.fecha);
          listaFichas[indexFicha] = ficha;
          cliente.ficha[index] = ficha;
          updateCliente(cliente);
          resetFormControls();
          swal("¡ Modificada !", "La ficha fue modificada", "success");
        } else {
          swal("¡La ficha NO fue modificada!");
        }
      });
    }
  } else if (idSubmitter === "btn-controles-eliminar") {
    if (index !== -1) {
      swal({
        title: `¿Seguro que quiere eliminar la ficha del ${dateFormat(
          new Date(cliente.ficha[index].fecha + "T00:00:00")
        )}?`,
        text: "Una vez eliminada no es posible recuperarla.",
        icon: "warning",
        buttons: true,
        dangerMode: true,
      }).then((willDelete) => {
        if (willDelete) {
          let fichaToDelete = cliente.ficha[index];
          let indexFicha = listaFichas.findIndex((c) => c.id == ficha.id && c.fecha == ficha.fecha);
          cliente.ficha.splice(index, 1);
          listaFichas.splice(indexFicha, 1);
          deleteFicha(fichaToDelete);
          resetFormControls();
          swal("¡ Eliminada ! ", "La ficha fue eliminada", "success");
        } else {
          swal("La ficha NO fue eliminada!");
        }
      });
    }
  }
});

$ulControl.addEventListener("click", (e) => {
  const {fecha} = $formularioControl;
  const date = e.target.dataset.date;
  const ficha = cliente.ficha.find((c) => c.fecha === date);
  document.querySelector("#btn-controles-agregar").disabled = true;
  document.querySelector("#btn-controles-modificar").disabled = false;
  document.querySelector("#btn-controles-eliminar").disabled = false;
  fecha.disabled = true;
  uploadControl(ficha);
});
// EVENTOS PANTALLA Y FORMULARIOS --------------------------------------------------------------------

// CRUD CLIENTE **************************************************************************************

async function getClientes() {
  let jwt = localStorage.getItem("jwt");
  let headers = { headers: { Authorization: "Bearer " + jwt } };
  $divSpinner.appendChild(getSpinner());
  try {
    const { data } = await axios.get(URL + "listarClientes", headers);
    return data.dato;
  } catch (error) {
    console.error(error);
    logOutForced();
  } finally {
    clearDivSpinner();
  }
}

async function createCliente(nuevoCliente, ficha) {
  let jwt = localStorage.getItem("jwt");
  let headers = { headers: { Authorization: "Bearer " + jwt } };
  try {
    const { data } = await axios.post(URL + "agregarCliente", nuevoCliente, headers);
    nuevoCliente.id = data.id_nuevo;
    nuevoCliente.id_ficha = data.id_nuevo;
    ficha.id = data.id_nuevo;
    updateCliente(nuevoCliente);
    createFicha(ficha);
    resetForm();
  } catch (error) {
    console.error(error);
    logOutForced();
  }
}

async function updateCliente(clienteToEdit) {
  let jwt = localStorage.getItem("jwt");
  let headers = { headers: { Authorization: "Bearer " + jwt } };
  try {
    resetForm();
    const { data } = await axios.post(URL + "modificarCliente", clienteToEdit, headers);
    updateTable(listaClientes);
    return data;
  } catch (error) {
    console.error(error);
    logOutForced();
  }
}

async function deleteCliente(id) {
  let jwt = localStorage.getItem("jwt");
  let headers = { headers: { Authorization: "Bearer " + jwt } };
  try {
    resetForm();
    const { data } = await axios.post(URL + "eliminarCliente", { id: id }, headers);
    updateTable(listaClientes);
  } catch (error) {
    console.error(error);
    logOutForced();
  }
}

// CRUD CLIENTE **************************************************************************************

// CRUD CONTROL **************************************************************************************
async function createFicha(nuevaFicha) {
  let jwt = localStorage.getItem("jwt");
  let headers = { headers: { Authorization: "Bearer " + jwt } };
  try {
    const { data } = await axios.post(URL + "agregarFicha", nuevaFicha, headers);
  } catch (error) {
    console.error(error);
    logOutForced();
  }
}

async function getFichas() {
  $divSpinner.appendChild(getSpinner());
  let jwt = localStorage.getItem("jwt");
  let headers = { headers: { Authorization: "Bearer " + jwt } };
  try {
    const { data } = await axios.get(URL + "listarFichas", headers);
    return data.dato;
  } catch (error) {
    console.error(error);
    logOutForced();
  } finally {
    clearDivSpinner();
  }
}

async function deleteFicha(ficha) {
  let jwt = localStorage.getItem("jwt");
  let headers = { headers: { Authorization: "Bearer " + jwt } };
  try {
    const { data } = await axios.post(URL + "eliminarFicha", ficha, headers);
  } catch (error) {
    console.error(error);
    logOutForced();
  }
}

// CRUD CONTROL **************************************************************************************

// FUNCIONES PARA CARGA Y RESETEO DE FORMULARIOS -----------------------------------------------------

async function updateTable() {
  while ($divTable.hasChildNodes()) {
    $divTable.removeChild($divTable.firstChild);
  }
  const data = await getClientes();
  if (data) {
    listaClientes = null;
    listaClientes = [...data];
    $divTable.appendChild(createTable(listaClientes));
    paginarTabla();
  }
}

function resetForm() {
  $formularioCRUD.reset();
  $btnCrear.disabled = false;
  $btnModificar.disabled = true;
  $btnDelete.disabled = true;
  $btnFicha.disabled = true;
  $btnForm.innerText = "Guardar";
  $btnForm.classList.remove("btn-success");
  $btnForm.classList.remove("btn-danger");
  date.value = actualDate.toJSON().slice(0, 10);
}

function uploadFormCRUD(cliente) {
  const { nombre, apellido, telefono, observacion, fecha, detalle } = $formularioCRUD;

  nombre.value = cliente.nombre[0].toUpperCase() + cliente.nombre.slice(1);
  apellido.value = cliente.apellido[0].toUpperCase() + cliente.apellido.slice(1);
  telefono.value = cliente.telefono;
  observacion.value = cliente.observacion;
  if (cliente.ficha !== undefined) {
    fecha.value = cliente.ficha[0].fecha;
    detalle.value = cliente.ficha[0].detalle;
  }
}

function resetFormControls() {
  $formularioControl.reset();
  uploadFormControl(cliente);
  updateControlList(cliente);
  document.querySelector("#btn-controles-agregar").disabled = false;
  document.querySelector("#btn-controles-modificar").disabled = true;
  document.querySelector("#btn-controles-eliminar").disabled = true;
  activateControlFields();
  resetColors();
}

function uploadFormControl(cliente) {
  const { nombre, apellido, fecha } = $formularioControl;

  nombre.value = cliente.nombre[0].toUpperCase() + cliente.nombre.slice(1);
  apellido.value = cliente.apellido[0].toUpperCase() + cliente.apellido.slice(1);
  fecha.value = actualDate.toJSON().slice(0, 10);
}

function uploadControl(ficha) {
  const { fecha, detalle } = $formularioControl;

  fecha.value = ficha.fecha;
  detalle.value = ficha.detalle;
}

function lookForClient(clientes, id) {
  return clientes.some((el) => el.id === id);
}

function resetColors() {
  const inputs = document.querySelectorAll("#form-controls input");
  inputs.forEach((i) => {
    i.removeAttribute("style");
  });
}

function disableInputsCrud() {
  const { nombre, apellido, telefono, observacion, fecha, detalle } = $formularioCRUD;
  nombre.disabled = true;
  apellido.disabled = true;
  telefono.disabled = true;
  observacion.disabled = true;
  fecha.disabled = true;
  detalle.disabled = true;
}

function enableInputsCrud() {
  const { nombre, apellido, telefono, observacion, fecha, detalle } = $formularioCRUD;
  nombre.disabled = false;
  apellido.disabled = false;
  telefono.disabled = false;
  observacion.disabled = false;
  detalle.disabled = false;
}

// FUNCIONES PARA CARGA Y RESETEO DE FORMULARIOS -----------------------------------------------------

function getSpinner() {
  const spinner = document.createElement("img");
  spinner.setAttribute("src", "./assets/spinner.gif");
  spinner.setAttribute("alt", "loader");
  spinner.style.marginLeft = "43%";
  spinner.style.width = "10rem";
  return spinner;
}

function clearDivSpinner() {
  while ($divSpinner.hasChildNodes()) {
    $divSpinner.removeChild($divSpinner.firstChild);
  }
}

// JWT, login y logOut***********************************************************************
function VerificarJWT() {
  var jwt = localStorage.getItem("jwt");
  $.ajax({
    type: "GET",
    url: URL + "login",
    dataType: "json",
    data: {},
    headers: { Authorization: "Bearer " + jwt },
    async: true,
  })
    .done(function (obj_rta) {
      if (obj_rta.exito) {
        const foto = document.querySelector("#foto-usuario");
        const nombre = document.querySelector("#nombre-usuario");
        let nombreUsuario = obj_rta.payload.usuario.nombre;
        if (nombreUsuario === "ezequiel") {
          foto.setAttribute("src", "./assets/ezequiel2.png");
          nombre.innerText = nombreUsuario[0].toUpperCase() + nombreUsuario.slice(1).toLowerCase();
        } else if (nombreUsuario === "lilian") {
          foto.setAttribute("src", "./assets/lilian1.png");
          nombre.innerText = nombreUsuario[0].toUpperCase() + nombreUsuario.slice(1).toLowerCase();
        }
        swal("¡ Bienvenido !", "Tu sesión esta iniciada", "success");
      } else {
        swal("¡ Inicio Fallido !", "Debes iniciar sesión para continuar", "error");
        setTimeout(() => {
          $(location).attr("href", URL);
        }, 1000);
      }
    })
    .fail(function (jqXHR, textStatus, errorThrown) {
      var retorno = JSON.parse(jqXHR.responseText);
      if (retorno.exito == false) {
        swal("¡ Inicio Fallido !", "Debes iniciar sesión para continuar", "error");
        setTimeout(() => {
          $(location).attr("href", URL);
        }, 1000);
      }
    });
}

function logOut() {
  localStorage.removeItem("jwt");
  swal("¡ Sesión cerrada !", "Redirigiendo...", "success");
  setTimeout(() => {
    $(location).attr("href", URL);
  }, 2000);
}

function logOutForced() {
  localStorage.removeItem("jwt");
  swal("¡ Inicio Fallido !", "Debes iniciar sesión para continuar", "error");
  setTimeout(() => {
    $(location).attr("href", URL);
  }, 2000);
}

// Buscador *************************************************************************
function updateTableBuscador(listado) {
  while ($divTable.hasChildNodes()) {
    $divTable.removeChild($divTable.firstChild);
  }
  if (listado) {
    $divTable.appendChild(createTable(listado));
    paginarTabla();
  }
}

function searchByName(listado, nombre) {
  return listado.filter((cliente) => {
    return cliente.nombre.toLowerCase() == nombre;
  });
}

function searchByLastName(listado, apellido) {
  return listado.filter((cliente) => {
    return cliente.apellido.toLowerCase() == apellido;
  });
}

function searchByNameAndLastName(listado, nombre, apellido) {
  return listado.filter((cliente) => {
    return cliente.nombre.toLowerCase() == nombre && cliente.apellido.toLowerCase() == apellido;
  });
}

// Paginación
function paginarTabla() {
  $(document).ready(function () {
    $("#tablaClientes").DataTable({
      language: {
        processing: "Tratamiento en curso...",
        search: "Buscar&nbsp;:",
        lengthMenu: "Agrupar de _MENU_ clientes",
        info: "Cliente _START_ al _END_ de _TOTAL_ clientes",
        infoEmpty: "No existen datos.",
        infoFiltered: "(filtrado de _MAX_ elementos en total)",
        infoPostFix: "",
        loadingRecords: "Cargando...",
        zeroRecords: "No se encontraron datos con tu busqueda",
        emptyTable: "No hay datos disponibles en la tabla.",
        paginate: {
          first: "Primero",
          previous: "Anterior",
          next: "Siguiente",
          last: "Ultimo",
        },
        aria: {
          sortAscending: ": active para ordenar la columna en orden ascendente",
          sortDescending: ": active para ordenar la columna en orden descendente",
        },
      },
      searching: false,
    });
  });
}

export { updateTable, resetForm };
