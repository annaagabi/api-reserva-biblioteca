const mongoose = require('mongoose');
 
const salaGrupoSchema = new mongoose.Schema({
  idSala: Number,
  nome: String,
  qtd_pessoas: Number,
  turma: String,
  motivo: String,
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
 
module.exports = mongoose.model('SalaGrupo', salaGrupoSchema);