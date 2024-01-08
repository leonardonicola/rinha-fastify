import { v4 as uuidv4 } from "uuid";
import pg from "@fastify/postgres";
import Fastify from "fastify";
import "dotenv/config";
const fastify = Fastify({
  ajv: {
    customOptions: {
      coerceTypes: false,
    },
  },
});

fastify.register(pg, {
  connectionString: process.env.DATABASE_URL,
  max: 35,
});

fastify.ready((err) => {
  connect();
});

async function connect() {
  try {
    await fastify.pg.connect();
  } catch (err) {
    setTimeout(() => {
      connect();
    }, 3000);
  }
}

fastify.get(
  "/pessoas/:id",
  {
    schema: {
      params: {
        type: "object",
        properties: {
          id: {
            type: "string",
            format: "uuid",
          },
        },
        required: ["id"],
      },
    },
  },
  (req, reply) => {
    fastify.pg.query(
      "SELECT * FROM pessoas WHERE id=$1 LIMIT 1",
      [req.params.id],
      (err, res) => {
        if (res.rowCount === 0) {
          reply.status(404).send();
          return;
        }
        reply.send(res.rows);
      }
    );
  }
);

fastify.post(
  "/pessoas",
  {
    schema: {
      body: {
        type: "object",
        required: ["apelido", "nome", "nascimento"],
        properties: {
          apelido: { type: "string", maxLength: 32 },
          nome: { type: "string", maxLength: 100 },
          nascimento: { type: "string", format: "date" },
          stack: {
            type: "array",
            nullable: true,
            items: { type: "string", maxLength: 32 },
          },
        },
      },
    },
  },
  (req, reply) => {
    const id = uuidv4();
    const { apelido, nome, nascimento, stack } = req.body;
    fastify.pg.query(
      "INSERT INTO pessoas (id, apelido, nome, nascimento, stack) VALUES ($1, $2, $3, $4, $5::json)",
      [id, apelido, nome, nascimento, JSON.stringify(stack)],
      (err, res) => {
        if (err) {
          reply.status(400).send();
          return;
        }
        reply
          .status(201)
          .header("location", `/pessoas/${id}`)
          .send({ id, apelido, nome, nascimento, stack });
      }
    );
  }
);

fastify.get(
  "/pessoas",
  {
    schema: {
      querystring: {
        type: "object",
        properties: {
          t: {
            type: "string",
            minLength: 1,
          },
        },
        required: ["t"],
      },
    },
  },
  (req, reply) => {
    fastify.pg.query(
      "SELECT id, apelido, nome, to_char(nascimento, 'YYYY-MM-DD') as nascimento, stack FROM pessoas WHERE searchable ILIKE $1 LIMIT 50",
      [`%${req.query.t}%`],
      (err, res) => {
        reply.status(200).send(res.rows);
      }
    );
  }
);

fastify.get("/contagem-pessoas", (_req, reply) => {
  fastify.pg.query("SELECT COUNT(1) FROM pessoas", (err, res) => {
    reply.status(200).send(res.rows[0].count);
  });
});

fastify.setErrorHandler(function (error, _, reply) {
  if (error.validation) {
    if (error.validationContext === "querystring") {
      reply.status(400).send();
      return;
    }
    reply.status(422).send();
    return;
  }
});

// Run the server!
fastify.listen({ port: 3000, host: "0.0.0.0" }, (err, address) => {
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log(`Server listening at ${address}`);
});
