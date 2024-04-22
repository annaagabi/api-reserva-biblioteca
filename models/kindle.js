const mongoose = require('mongoose');

const kindleSchema = new mongoose.Schema({
    idKindle: Number,
    nome: String,
    turma: String,
    data: {
      type: Date
    },
    horario_inicial: { 
      type: String, 
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ }, // Padrão de texto para validar o formato HH:MM
    horario_final: { 
      type: String, 
      match: /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/ }
  });
   
module.exports = mongoose.model('Kindle', kindleSchema);