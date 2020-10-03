const supertest = require("supertest");
process.env.DB_URI = process.env.MONGO_URL;
process.env.PORT = 0;
const { mongoose, listener } = require("../server");

let request;

beforeAll(() => {
  request = supertest(listener);
});

afterAll(() => {
  return Promise.all([mongoose.disconnect(), listener.close()]);
});

describe("GET", () => {
  test("/", async () => {
    const response = await request.get("/");

    expect(response.status).toBe(200);
  });
});

describe("Get all users", () => {
  test("when there is one user", async () => {
    const USERNAME = "TEST_USERNAME";
    await request
      .post("/api/exercise/new-user")
      .send("username=" + USERNAME)
      .set("Accept", "application/json");

    const response = await request
      .get("/api/exercise/users")
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body[0].username).toBe(USERNAME);
  });
});

describe("Get user log", () => {
  test("when the log has a count of 2", async () => {
    const ID = "TEST_ID";
    const response = await request
      .get("/api/exercise/log?userId=" + ID)
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(ID);
  });
});

describe("Post new user", () => {
  test("when user has valid username", async () => {
    const USERNAME = "TEST_USERNAME";
    const response = await request
      .post("/api/exercise/new-user")
      .send("username=" + USERNAME)
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body.username).toBe(USERNAME);
  });
});

describe("Post exercise", () => {
  test("when valid ID is submitted", async () => {
    const ID = "TEST_ID";
    const response = await request
      .post("/api/exercise/add")
      .send("userId=" + ID)
      .set("Accept", "application/json");

    expect(response.status).toBe(200);
    expect(response.body._id).toBe(ID);
  });
});
