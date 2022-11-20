class Cliente {
  constructor(id, id_ficha, nombre, apellido, telefono, observacion, ficha) {
    this.id = id;
    this.id_ficha = id_ficha;
    this.nombre = nombre;
    this.apellido = apellido;
    this.telefono = telefono;
    this.observacion = observacion;
    this.ficha = ficha;
  }
}

class Ficha {
  constructor(id, fecha, detalle) {
    this.id = id;
    this.fecha = fecha;
    this.detalle = detalle;
  }
}

export { Cliente, Ficha};
