const express = require('express')
const router = express.Router()
const Kindle = require('../models/kindle')


const bodyParser = require('body-parser')
const app = express()

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
    const{  idKindle, nome, turma, data, horario_inicial, horario_final} = req.body

     // Verifica se há campos em branco
     if (!idKindle || !nome || !turma || !data || !horario_inicial || !horario_final) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }
    // Verifica o id do kindle
    if (idKindle && (idKindle < 1 || idKindle > 4)) {
        return res.status(400).json({ message: 'O ID do Kindle deve estar entre 1 e 4' });
      }

      const date = new Date(data);
      const dayOfWeek = date.getDay();
  
      if (!HorarioFuncionamento(dayOfWeek, horario_inicial, horario_final)) {
          return res.status(422).json({ message: 'Reserva fora do horário de funcionamento' });
      }
    
    // Verifica se já existe uma reserva para o mesmo Kindle, mesma data e horários sobrepostos
    const existingReservation = await Kindle.findOne({
        idKindle,
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

    if (existingReservation) {
        return res.status(422).json({ message: 'Já existe uma reserva para este Kindle e horário' });
    }

    const kindleData = {
        idKindle, 
        nome, 
        turma, 
        data,
        horario_inicial, 
        horario_final
    }

// Cria dados no sistema

    try{
        // criando dados
        await Kindle.create(kindleData)

        // recurso criado com sucesso
        res.status(201).json({message: 'Reserva inserida no sistema com sucesso'})
    } catch(error){
        res.status(500).json({error: error})
    }

})

// Read - Leitura de dados
router.get('/', async(req, res) =>{
    try{
        const kindle = await Kindle.find()

         // status 200: a requisição foi realizada com sucesso
         res.status(200).json(kindle)
    } catch(error){
        res.status(500).json({error: error})
    }
})

// Rotas dinâmicas
router.get('/:id' , async(req, res) =>{

    // Extrai o dado da requisição pela url = req.params
    const id = req.params.id

    try{
        const kindle= await Kindle.findOne({_id: id})

        if(!kindle){
            res.status(422).json({message: 'Reserva não encontrado'})
            return
        }

        res.status(200).json(kindle)

    } catch(error){
        res.status(500).json({error: error})
    }
})

// Updadte - atualização de dados (PUT, PATCH)
// PUT - espera que mandemos um objeto completo para realizar a atualização de registro do sistema
// PATCH - Atualização parcial

router.patch('/:id', async(req, res) =>{
    //a url vai vir com o id do usuario
    const id = req.params.id

    // o corpo vai vir com os dados que precisam ser atualizados
    const{  idKindle, nome, turma, data, horario_inicial, horario_final} = req.body

     // Verifica se há campos em branco
     if (!idKindle || !nome || !turma || !data || !horario_inicial || !horario_final) {
        return res.status(400).json({ message: 'Todos os campos são obrigatórios' });
    }
    if (idKindle && (idKindle < 1 || idKindle > 4)) {
        return res.status(400).json({ message: 'O ID do Kindle deve estar entre 1 e 4' });
      }

    const date = new Date(data);
    const dayOfWeek = date.getDay();
  
    if (!HorarioFuncionamento(dayOfWeek, horario_inicial, horario_final)) {
        return res.status(422).json({ message: 'Reserva fora do horário de funcionamento' });
    }

    // Verifica se já existe uma reserva para o mesmo Kindle, mesma data e horários sobrepostos
    const existingReservation = await Kindle.findOne({
        _id: { $ne: id },
        idKindle,
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

    if (existingReservation) {
        return res.status(422).json({ message: 'Já existe uma reserva para este Kindle e horário' });
    }

    const kindleData = {
        idKindle, 
        nome, 
        turma, 
        data,
        horario_inicial,
        horario_final
    }

    try{
        const updatedKindle = await Kindle.updateOne({_id: id}, kindleData)

         // Se não atualizou nada
        if(updatedKindle.matchedCount === 0 ) { // validação de existencia de post
            res.status(422).json({message: 'A reserva não foi encontrada'})
            return 
        }

        res.status(200).json(kindleData)

    }catch(error){
        res.status(500).json({error: error})
    }
})

// Delete - deletar dados

router.delete('/:id', async (req, res) =>{
    const id = req.params.id

    const kindle = await Kindle.findOne({_id: id})

    if(!kindle){
        res.status(422).json({ message: 'A reserva não foi encontrada' })
        return // não executa mais nenhuma linha
    }

    try{
        await Kindle.deleteOne({_id: id})
        res.status(200).json({ message:'Reserva removida com sucesso'})

    } catch(error){
        res.status(500).json({error: error})
    }
})

module.exports = router