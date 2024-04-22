//const router = require('express').Router()
//const Posts = require('../models/posts')
const express = require('express')
const router = express.Router()
const SalaGrupo = require('../models/salaGrupo')

const bodyParser = require('body-parser')
const app = express()


app.use(bodyParser.json())

app.use(bodyParser.json())

// Função para verificar se um horário está dentro de um intervalo
function Intervalo(time, start, end) {
        return time >= start && time <= end;
}
    
    // Função para verificar se a reserva está dentro do horário de funcionamento
    function HorarioFuncionamento(dayOfWeek, horario_inicial, horario_final) {
        // Lógica para verificar o horário de funcionamento baseado no dia da semana
        switch (dayOfWeek) {
            case 0: // Domingo
                return false; // Não há funcionamento aos domingos
            case 1: // Segunda-feira
                return Intervalo(horario_inicial, '12:30', '18:00') || Intervalo(horario_final, '19:00', '21:30');
            case 2: // Terça-feira 
                return Intervalo(horario_inicial, '09:00', '12:15') ||
            Intervalo(horario_final, '13:15', '21:30');
            case 3: // Quarta-feira
                return Intervalo(horario_inicial, '09:00', '12:15') ||
                Intervalo(horario_final, '13:15', '21:30');
            case 4: // Quinta-feira
                return Intervalo(horario_inicial, '09:00', '12:15') ||
                    Intervalo(horario_final, '13:15', '21:30');
            case 5: // Sexta-feira
                return Intervalo(horario_inicial, '09:00', '12:15') ||
                    Intervalo(horario_final, '13:15', '21:30');
            case 6: // Sábado
                return Intervalo(horario_inicial, '09:00', '13:00') &&
                    Intervalo(horario_final, '09:00', '13:00');
            default:
                return false;
        }
    }


// Rotas da API

// Create - criação de dados

router.post('/', async (req, res) => {
    // const{ idSala, nome, qtd_pessoas, turma, motivo, data, horario_inicial, horario_final } = req.body

    // if (!idSala || !nome || !qtd_pessoas || !turma || !data || !horario_inicial || !horario_final || motivo) {
    //     return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    // }

    const { idSala, nome, qtd_pessoas, turma, motivo, data, horario_inicial, horario_final } = req.body;

    // Verifica se há campos em branco
    if (!idSala || !nome || !qtd_pessoas || !turma || !data || !horario_inicial || !horario_final || !motivo) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    // Verifica o ID da sala
    if (idSala&& (idSala< 1 || idSala> 2)) {
        return res.status(400).json({ message: 'O ID da sala deve estar entre 1 e 2' });
      }

    const date = new Date(data);
    const dayOfWeek = date.getDay();
  
    if (!HorarioFuncionamento(dayOfWeek, horario_inicial, horario_final)) {
        return res.status(422).json({ message: 'Reserva fora do horário de funcionamento' });
    }

    // Verifica se já existe uma reserva para o mesmo Kindle, mesma data e horários sobrepostos
    const existingReservation = await SalaGrupo.findOne({
        idSala,
        data,
        $or: [
            {
                $and: [
                    { horario_inicial: { $lte: horario_inicial } },
                    { horario_final: { $gte: horario_inicial } }
                ]
            },
            {
                $and: [
                    { horario_inicial: { $lte: horario_final } },
                    { horario_final: { $gte: horario_final } }
                ]
            }
        ]
    });

    // Verifica se reserva e horário já existe
    if (existingReservation) {
        return res.status(422).json({ message: 'Já existe uma reserva para esta sala e horário' });
    }

    const salaGrupoData = {
        idSala,
        nome,
        qtd_pessoas,
        turma,
        motivo,
        data,
        horario_inicial,
        horario_final
    }

// Cria dados no sistema

    try{
        // criando dados
        await SalaGrupo.create(salaGrupoData)

        // recurso criado com sucesso
        res.status(201).json({message: 'Reserva inserida no sistema com sucesso'})
    } catch(error){
        res.status(500).json({error: error})
    }

})

// Read - Leitura de dados
router.get('/', async(req, res) =>{
    try{
        const salaGrupo = await SalaGrupo.find()

         // status 200: a requisição foi realizada com sucesso
         res.status(200).json(salaGrupo)
    } catch(error){
        res.status(500).json({error: error})
    }
})

// Rotas dinâmicas
router.get('/:id' , async(req, res) =>{

    // Extrai o dado da requisição pela url = req.params
    const id = req.params.id

    try{
        const salaGrupo = await SalaGrupo.findOne({_id: id})

        if(!salaGrupo){
            res.status(422).json({message: 'Reserva não encontrado'})
            return
        }

        res.status(200).json(salaGrupo)

    } catch(error){
        res.status(500).json({error: error})
    }
})


// PATCH - Atualização parcial

router.patch('/:id', async (req, res) => {
    const id = req.params.id;
    const { idSala, nome, qtd_pessoas, turma, motivo, data, horario_inicial, horario_final } = req.body;

    // verifica se os campos estão em branco
    if (!idSala || !nome || !qtd_pessoas || !turma || !data || !horario_inicial || !horario_final || !motivo) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }

    // Verifica se o ID da sala é valido
    if (idSala && (idSala < 1 || idSala > 2)) {
        return res.status(400).json({ message: 'O ID da sala deve estar entre 1 e 2' });
    }

    const date = new Date(data);
    const dayOfWeek = date.getDay();
  
    if (!HorarioFuncionamento(dayOfWeek, horario_inicial, horario_final)) {
        return res.status(422).json({ message: 'Reserva fora do horário de funcionamento' });
    }

    // Verifica se já existe uma reserva para a mesma sala, mesma data e horários sobrepostos
    const existingReservation = await SalaGrupo.findOne({
        _id: { $ne: id }, // Exclui o documento com o ID correspondente
        idSala,
        data,
        $or: [
            {
                $and: [
                    { horario_inicial: { $lte: horario_inicial } },
                    { horario_final: { $gte: horario_inicial } }
                ]
            },
            {
                $and: [
                    { horario_inicial: { $lte: horario_final } },
                    { horario_final: { $gte: horario_final } }
                ]
            }
        ]
    });

    // Verifica se a reserva já existe
    if (existingReservation) {
        return res.status(422).json({ message: 'Já existe uma reserva para esta sala e horário' });
    }

    const salaGrupoData = {
        idSala,
        nome,
        qtd_pessoas,
        turma,
        data,
        horario_inicial,
        horario_final,
        motivo
    }

    try {
        const updatedSalaGrupo = await SalaGrupo.updateOne({ _id: id }, salaGrupoData);

        // Se não atualizou nada
        if (updatedSalaGrupo.matchedCount === 0) {
            res.status(422).json({ message: 'A reserva não foi encontrada' });
            return;
        }

        res.status(200).json(salaGrupoData);

    } catch (error) {
        res.status(500).json({ error: error });
    }
})


// Delete - deletar dados

router.delete('/:id', async (req, res) =>{
    const id = req.params.id

    const salaGrupo = await SalaGrupo.findOne({_id: id})

    if(!salaGrupo){
        res.status(422).json({ message: 'A reserva não foi encontrada' })
        return // não executa mais nenhuma linha
    }

    try{
        await SalaGrupo.deleteOne({_id: id})
        res.status(200).json({ message:'Reserva removida com sucesso'})

    } catch(error){
        res.status(500).json({error: error})
    }
})

module.exports = router