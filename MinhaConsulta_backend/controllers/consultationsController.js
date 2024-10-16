const db = require("../db/database");

// Função para obter o papel (role) de um usuário
const getUserRole = (req, res) => {
  const { username } = req.body;

  // Consulta SQL para buscar o papel do usuário com base no username
  const sql = `SELECT role FROM users WHERE username = ?`;
  db.get(sql, [username], (err, row) => {
    if (err) {
      // Retorna erro caso ocorra um problema na consulta ao banco de dados
      return res.status(500).json({ error: err.message });
    }
    console.log(row); // Log do resultado da consulta
    if (!row) {
      // Retorna erro caso o usuário não seja encontrado
      return res.status(404).json({ error: "Usuário não encontrado" });
    }
    // Retorna o papel do usuário encontrado
    res.json({ role: row.role });
  });
};

// Função para obter todas as consultas de um usuário
const getAllConsultations = (req, res) => {
  const { username } = req.query;
  console.log("Username recebido:", username); // Log do username recebido

  if (!username) {
    // Retorna erro caso o username não seja fornecido
    return res.status(400).json({ error: "Username não fornecido" });
  }

  let sql;
  let params = [];

  // Consulta SQL para buscar o papel e o ID do usuário com base no username
  const userRoleSql = `SELECT role, id FROM users WHERE username = ?`;

  db.get(userRoleSql, [username], (err, user) => {
    if (err) {
      // Retorna erro caso ocorra um problema na consulta ao banco de dados
      return res.status(500).json({ error: err.message });
    }

    console.log("Usuário encontrado:", user); // Log do usuário encontrado

    if (!user) {
      // Retorna erro caso o usuário não seja encontrado
      return res.status(404).json({ error: "Usuário não encontrado" });
    }

    const userRole = user.role;
    const userId = user.id;

    // Se o papel do usuário for 'admin', buscar todas as consultas
    if (userRole === "admin") {
      sql = `SELECT consultations.*, users.username FROM consultations 
             JOIN users ON consultations.userId = users.id`;
    } else {
      // Caso contrário, buscar apenas as consultas do próprio usuário
      sql = `SELECT consultations.*, users.username FROM consultations 
             JOIN users ON consultations.userId = users.id 
             WHERE consultations.userId = ?`;
      params = [userId];
    }

    // Executar a consulta e retornar as consultas encontradas
    db.all(sql, params, (err, rows) => {
      if (err) {
        // Retorna erro caso ocorra um problema na consulta ao banco de dados
        return res.status(500).json({ error: err.message });
      }
      res.json({ consultations: rows });
    });
  });
};

// Função para criar uma nova consulta
const createConsultation = (req, res) => {
  const { userId, date, doctor, specialty, status } = req.body;

  // Consulta SQL para inserir uma nova consulta na base de dados
  const sql = `INSERT INTO consultations (userId, date, doctor, specialty, status) 
               VALUES (?, ?, ?, ?, ?)`;
  const params = [userId, date, doctor, specialty, status];

  db.run(sql, params, function (err) {
    if (err) {
      // Retorna erro caso ocorra um problema na inserção da consulta
      return res.status(400).json({ error: err.message });
    }
    // Retorna mensagem de sucesso e o ID da consulta criada
    res.json({
      message: "Consulta criada com sucesso!",
      consultationId: this.lastID,
    });
  });
};

// Função para atualizar uma consulta existente
const updateConsultation = (req, res) => {
  const { id } = req.params;
  const { date, doctor, specialty, status, userId } = req.body;

  // Consulta SQL para atualizar uma consulta existente na base de dados
  const sql = `UPDATE consultations SET date = ?, doctor = ?, specialty = ?, status = ?, userId = ? WHERE id = ?`;
  const params = [date, doctor, specialty, status, userId, id];

  db.run(sql, params, function (err) {
    if (err) {
      // Retorna erro caso ocorra um problema na atualização da consulta
      return res.status(400).json({ error: err.message });
    }
    // Retorna mensagem de sucesso após a consulta ser atualizada
    res.json({ message: "Consulta atualizada com sucesso." });
  });
};

module.exports = {
  getAllConsultations,
  createConsultation,
  updateConsultation,
  getUserRole,
};