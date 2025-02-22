const request = require('supertest');
const app = require('../..');
const { clearDatabase } = require('../../db.connection');

const req = request(app);

describe('lab testing:', () => {
  let fakeUser1, fakeUser2, token, token2, todoId;

  beforeEach(async () => {
    fakeUser1 = {
      name: 'Hamza',
      email: 'hamza@example.com',
      password: 'test123',
    };

    // Create a user
    await req.post('/user/signup').send(fakeUser1);
    // Login to fakeUser1
    let fakeUserRes = await req.post('/user/login').send(fakeUser1);
    token = fakeUserRes.body.data;

    let todo = {
      title: 'Do a thing',
      description: 'do it just do it',
    };

    // Add 2 todos
    await req.post('/todo').send(todo).set({ authorization: token });

    let todoRes = await req
      .post('/todo')
      .send(todo)
      .set({ authorization: token });

    todoId = todoRes.body.data._id;

    fakeUser2 = {
      name: 'Deja',
      email: 'deja@example.com',
      password: 'test123',
    };

    // Create a user without any todo
    await req.post('/user/signup').send(fakeUser2);
    // Login to fakeUser2
    let fakeUserRes2 = await req.post('/user/login').send(fakeUser2);
    token2 = fakeUserRes2.body.data;
  });

  describe('users routes:', () => {
    describe('Test search by name route', () => {
      // Note: user name must be sent in req query not req params
      it('req to get(/user/search) ,expect to get the correct user with his name', async () => {
        let res = await req.get('/user/search').query({ name: fakeUser1.name });
        expect(res.statusCode).toBe(200);
        expect(res.body.data.name).toBe(fakeUser1.name);
        expect(res.body.data.email).toBe(fakeUser1.email);
      });

      it('req to get(/user/search) with invalid name ,expect res status and res message to be as expected', async () => {
        let res = await req.get('/user/search').query({ name: 'Nothing' });
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('There is no user with name: Nothing');
      });
    });

    describe('Test delete all users', () => {
      it('req to delete(/user/, should delete all users)', async () => {
        let res = await req.delete('/user/');
        expect(res.statusCode).toBe(200);
        expect(res.body.message).toBe('users have been deleted successfully');
      });
    });
  });

  describe('todos routes:', () => {
    it('req to patch( /todo/) with id only ,expect res status and res message to be as expected', async () => {
      let res = await req
        .patch(`/todo/${todoId}`)
        .set({ authorization: token });
      expect(res.statusCode).toBe(400);
      expect(res.body.message).toBe('must provide title and id to edit todo');
    });

    it('req to patch( /todo/) with id and title ,expect res status and res to be as expected', async () => {
      let res = await req
        .patch(`/todo/${todoId}`)
        .send({ title: 'Do a diff thing' })
        .set({ authorization: token });
      expect(res.statusCode).toBe(200);
      expect(res.body.data.title).toBe('Do a diff thing');
    });

    it("req to get( /todo/user) ,expect to get all user's todos", async () => {
      let res = await req.get('/todo/user').set({ authorization: token });
      expect(res.statusCode).toBe(200);
      expect(res.body.data).toHaveSize(2);
    });

    it("req to get( /todo/user) ,expect to not get any todos for user hasn't any todo", async () => {
      let res = await req.get('/todo/user').set({ authorization: token2 });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toContain("Couldn't find any todos for");
    });

    it('req delete(/todo), expect to delete all the todos', async () => {
      let res = await req.delete('/todo').set({ authorization: token });
      expect(res.statusCode).toBe(200);
      expect(res.body.message).toBe('todos have been deleted successfully');
    });
  });

  afterEach(async () => {
    await clearDatabase();
  });
});
