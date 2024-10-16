const express = require("express");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const db = require("../db/database");

const router = express.Router();
const JWT_SECRET = "seu-segredo-aqui";

// Endpoint para cadastrar um novo usuário
router.post("/register", (req, res) => {
  const { username, password, confirmPassword } = req.body;
  let { role } = req.body;

  // Definir o papel (role) como 'user' caso não seja fornecido
  if (!role) {
    role = "user";
  }

  console.log("Dados recebidos:", { username, role }); // Log para verificar os dados

  // Conferir se a senha e a confirmação são iguais
  if (password !== confirmPassword) {
    return res.status(400).json({ message: "As senhas não coincidem." });
  }

  // Verificar se o usuário já está registrado
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, row) => {
    if (err) {
      console.error("Erro ao verificar o usuário:", err);
      return res.status(500).json({ message: "Erro ao verificar o usuário." });
    }
    if (row) {
      return res.status(400).json({ message: "Usuário já existe." });
    }

    // Criptografar a senha
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Erro ao cadastrar o usuário." });
      }

      // Inserir o novo usuário na base de dados
      db.run(
        "INSERT INTO users (username, password, role) VALUES (?, ?, ?)",
        [username, hash, role],
        function (err) {
          if (err) {
            console.error("Erro ao inserir o usuário:", err);
            return res
              .status(500)
              .json({ message: "Erro ao cadastrar o usuário." });
          }
          res.status(201).json({ message: "Usuário cadastrado com sucesso." });
        }
      );
    });
  });
});

// Endpoint para obter todos os usuários ou um usuário específico
router.get("/users", (req, res) => {
  const { username, id } = req.query;

  if (username) {
    // Buscar pelo username
    db.get(
      "SELECT * FROM users WHERE username = ?",
      [username],
      (err, user) => {
        if (err) {
          console.error("Erro ao buscar usuário:", err);
          return res.status(500).json({ message: "Erro ao buscar usuário." });
        }
        if (!user) {
          return res.status(404).json({ message: "Usuário não encontrado." });
        }
        res.json(user);
      }
    );
  } else if (id) {
    // Buscar pelo ID
    db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
      if (err) {
        console.error("Erro ao buscar usuário:", err);
        return res.status(500).json({ message: "Erro ao buscar usuário." });
      }
      if (!user) {
        return res.status(404).json({ message: "Usuário não encontrado." });
      }
      res.json(user);
    });
  } else {
    // Buscar todos os usuários
    db.all("SELECT * FROM users", [], (err, users) => {
      if (err) {
        console.error("Erro ao buscar usuários:", err);
        return res.status(500).json({ message: "Erro ao buscar usuários." });
      }
      res.json(users);
    });
  }
});

// Endpoint para obter um usuário específico pelo ID
router.get("/users/:id", (req, res) => {
  const { id } = req.params;

  // Buscar o usuário pelo ID
  db.get("SELECT * FROM users WHERE id = ?", [id], (err, user) => {
    if (err) {
      console.error("Erro ao buscar usuário:", err);
      return res.status(500).json({ message: "Erro ao buscar usuário." });
    }
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    res.json(user);
  });
});

// Endpoint para atualizar um usuário
router.put("/users/:id", (req, res) => {
  const { id } = req.params;
  const { username, password, role } = req.body;

  // Se a senha for fornecida, criptografá-la
  if (password) {
    bcrypt.hash(password, 10, (err, hash) => {
      if (err) {
        return res
          .status(500)
          .json({ message: "Erro ao criptografar a senha." });
      }

      // Atualizar o usuário com a nova senha criptografada
      db.run(
        "UPDATE users SET username = ?, password = ?, role = ? WHERE id = ?",
        [username, hash, role, id],
        function (err) {
          if (err) {
            console.error("Erro ao atualizar usuário:", err);
            return res
              .status(500)
              .json({ message: "Erro ao atualizar o usuário." });
          }
          res.status(200).json({ message: "Usuário atualizado com sucesso." });
        }
      );
    });
  } else {
    // Atualizar o usuário sem modificar a senha
    db.run(
      "UPDATE users SET username = ?, role = ? WHERE id = ?",
      [username, role, id],
      function (err) {
        if (err) {
          console.error("Erro ao atualizar usuário:", err);
          return res
            .status(500)
            .json({ message: "Erro ao atualizar o usuário." });
        }
        res.status(200).json({ message: "Usuário atualizado com sucesso." });
      }
    );
  }
});

// Endpoint para deletar um usuário
router.delete("/users/:id", (req, res) => {
  const { id } = req.params;

  // Remover o usuário pelo ID
  db.run("DELETE FROM users WHERE id = ?", [id], function (err) {
    if (err) {
      console.error("Erro ao deletar usuário:", err);
      return res.status(500).json({ message: "Erro ao deletar o usuário." });
    }
    if (this.changes === 0) {
      return res.status(404).json({ message: "Usuário não encontrado." });
    }
    res.status(200).json({ message: "Usuário removido com sucesso." });
  });
});

// Endpoint para login
router.post("/login", (req, res) => {
  const { username, password } = req.body;

  // Buscar o usuário pelo username
  db.get("SELECT * FROM users WHERE username = ?", [username], (err, user) => {
    if (err || !user) {
      return res.status(401).json({ message: "Credenciais inválidas." });
    }

    // Comparar a senha fornecida com a armazenada
    bcrypt.compare(password, user.password, (err, match) => {
      if (err || !match) {
        return res.status(401).json({ message: "Credenciais inválidas." });
      }

      // Gerar um token JWT para o usuário autenticado
      const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, {
        expiresIn: "1h",
      });
      res.json({ token });
    });
  });
});

module.exports = router;