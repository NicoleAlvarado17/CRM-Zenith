// Variables de entorno minimas para que la app funcione durante las pruebas,
// sin depender del archivo .env real (que nunca se sube al repositorio).
process.env.JWT_SECRET = process.env.JWT_SECRET || "clave_de_prueba_usada_solo_en_tests";
process.env.JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "1h";
