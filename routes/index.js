var express = require('express');
var router = express.Router();


var config = {
  user: 'haikefpi',
  database: 'haikefpi',
  password: 'lYv-zjGr3IUZq3F5NUtJ6aFtU3BjG3Wh', //env var: PGPASSWORD
  host: 'rajje.db.elephantsql.com',
  port: 5432,
  max: 3,
  idleTimeoutMillis: 30000
};

var pg = require('pg');
var pool = new pg.Pool(config);

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('login');
});

router.post('/', function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      console.info(err);
      res.end('{"error" : "Error",' +
          ' "status" : 500}');
    }
    client.query("select id_predavaca, username, password from node.predavaci where username = $1 and password = $2;",
        [req.body.username, req.body.password],
        function (err, result) {
          done();

          if (err) {
            console.info(err);
            res.sendStatus(400);
          } else {
            let x = result.rows;
            if(x.length !== 0) {
              res.redirect('/predavac/' + req.body.username);
            }else{
              res.redirect('/');
            }
          }
        });
  });
});


router.get('/predavac/:username',
    function(req, res, next) {
      pool.connect(function (err, client, done) {
        if (err) {
          res.end('{"error" : "Error",' +
              ' "status" : 500}');
        }

        client.query("select a.sifra_predavanja, b.naziv, a.anketa from node.predavanja a, node.predmeti b " +
            "where a.id_predmeta = b.id_predmeta and a.id_predavaca = " +
            "(select id_predavaca from node.predavaci where username = $1);",
            [req.params.username],
            function (err, result) {
              done();
              if (err) {
                console.info(err);
                res.sendStatus(400);
              } else {
                res.render('index', {
                  title: 'Spisak predavanja',
                  objekti: result.rows,
                  user: req.params.username
                });
              }
            });
      });
    });


router.get('/:user/predmet/:sifra_predavanja',
    function(req, res, next) {
      pool.connect(function (err, client, done) {
        if (err) {
          res.end('{"error" : "Error",' +
              ' "status" : 500}');
        }

        client.query("select * from node.pitanja where sifra_predavanja = $1;",
            [req.params.sifra_predavanja],
            function (err, result) {
              done();
              if (err) {
                console.info(err);
                res.sendStatus(400);
              } else {
                res.render('predmet', {
                  title: 'Pitanja',
                  objekti: result.rows,
                  sifra: req.params.sifra_predavanja,
                  user: req.params.user
                });
              }
            });
      });
    });

router.post('/novo_pitanje/:user/:sifra_predavanja', function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error",' +
          ' "status" : 500}');
    }

    client.query("INSERT INTO node.pitanja (sifra_predavanja, tip_pitanja, pitanje) " +
        "values ($1, $3, $2);",
        [req.params.sifra_predavanja, req.body.pitanje, req.body.tip_pitanja],
        function (err, result) {
          done();

          if (err) {
            console.info(err);
            res.sendStatus(400);
          } else {
            res.redirect('/'+req.params.user + '/predmet/'+ req.params.sifra_predavanja);
          }
        });
  });
});

router.delete('/predmet/izbrisi/:id', function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error",' +
          ' "status" : 500}');
    }

    client.query("DELETE FROM node.odgovori " +
        "WHERE id_pitanja = $1;"
            [req.params.id],
        function (err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(400);
          } else {
            res.redirect('/izbrisi/'+req.params.id);
          }
        });
  });
});

router.delete('/izbrisi/:id', function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error",' +
          ' "status" : 500}');
    }

    client.query("DELETE FROM node.pitanja " +
        "WHERE id_pitanja = $1;"
            [req.params.id],
        function (err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(400);
          } else {
            res.sendStatus(200);
          }
        });
  });
});



router.post('/uredi_pitanje/:user/:sifra/:id', function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error",' +
          ' "status" : 500}');
    }

    client.query("UPDATE node.pitanja SET " +
        "tip_pitanja = $2, pitanje = $1 WHERE id_pitanja = $3;",
        [req.body.pitanje, req.body.tip_pitanja, req.params.id],
        function (err, result) {
          done();
          if (err) {
            console.info(err);
            res.sendStatus(400);
          } else {
            res.redirect('/'+req.params.user + '/predmet/'+ req.params.sifra);
          }
        });
  });
});

router.get('/aktiviraj/:user/:sifra', function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error",' +
          ' "status" : 500}');
    }

    client.query("UPDATE node.predavanja SET " +
        "anketa = not anketa WHERE sifra_predavanja = $1;",
        [req.params.sifra],
        function (err, result) {
          done();
          console.info(req.body);
          if (err) {
            console.info(err);
            res.sendStatus(400);
          } else {
            res.redirect('/predavac/'+req.params.user);
          }
        });
  });
});


router.get('/:index/:sifra_predavanja/:pitanje',
    function(req, res, next) {
      pool.connect(function (err, client, done) {
        if (err) {
          res.end('{"error" : "Error",' +
              ' "status" : 500}');
        }

        client.query("select x.sifra_predavanja, x.id_pitanja, x.pitanje, x.tip_pitanja, " +
            "x.naziv, x.anketa, y.odgovor " +

            "from (select distinct a.sifra_predavanja, a.id_pitanja, a.pitanje, a.tip_pitanja, b.naziv, c.anketa " +
            "from node.pitanja a, node.predmeti b, node.predavanja c " +
            "where a.sifra_predavanja = $1 and b.id_predmeta = c.id_predmeta and  c.sifra_predavanja = $1) as x " +

            "inner join node.odgovori y " +
            "on x.id_pitanja = y.id_pitanja " +
            "where index = $2;",
            [req.params.sifra_predavanja, req.params.index],
            function (err, result) {
              done();
              console.info(req.params.index, req.params.sifra_predavanja);
              console.info(req.body.anketa);
              if (err) {
                console.info(err);
                res.sendStatus(400);
              } else {
                res.render('studenti', {
                  objekti: result.rows,
                  sifra: req.params.sifra_predavanja,
                  i: req.params.pitanje,
                  index: req.params.index
                });
              }
            });
      });
    });

router.post('/odgovor/:id_pitanja', function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error",' +
          ' "status" : 500}');
    }

    client.query("UPDATE node.odgovori SET odgovor = $3 " +
        "WHERE id_pitanja = $1 AND index = $2;",
        [req.params.id_pitanja, req.body.index, req.body.odgovor],
        function (err, result) {
          done();

          if (err) {
            console.info(err);
            res.sendStatus(400);
          } else {
            res.redirect('/'+req.body.index+'/'+req.body.sifra+'/'+req.body.pitanje);
          }
        });
  });
});

router.post('/rezultati/:sifra/:index',
    function(req, res, next) {
      pool.connect(function (err, client, done) {
        if (err) {
          res.end('{"error" : "Error",' +
              ' "status" : 500}');
        }

        client.query("select a.pitanje, b.odgovor from node.pitanja a " +
            "inner join node.odgovori b " +
            "on b.id_pitanja = a.id_pitanja;",
            function (err, result) {
              done();
              if (err) {
                console.info(err);
                res.sendStatus(400);
              } else {
                res.render('rezultati', {
                  title: 'Rezultati',
                  objekti: result.rows,
                  sifra: req.params.sifra,
                  index: req.params.index
                });
              }
            });
      });
    });

router.post('/pitanje/', function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error",' +
          ' "status" : 500}');
    }

    client.query("insert into node.pitanja_studenata (pitanje, broj_glasova, index) " +
        "values ($2, 1, $1);",
        [req.body.index, req.body.pitanje],
        function (err, result) {
          done();

          if (err) {
            console.info(err);
            res.sendStatus(400);
          } else {
            res.redirect('/pitanja_studenata');
          }
        });
  });
});


router.get('/pregled/:sifra', function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error",' +
          ' "status" : 500}');
    }

    client.query("select a.id_pitanja, a.pitanje, b.odgovor, b.index from node.pitanja a " +
        "inner join node.odgovori b " +
        "on a.id_pitanja = b.id_pitanja " +
        "where a.sifra_predavanja = $1;",
        [req.params.sifra],
        function (err, result) {
          done();
          console.info(req.body);
          if (err) {
            console.info(err);
            res.sendStatus(400);
          } else {
            res.render('rezultati_profesor',{
              objekti: result.rows
            });
          }
        });
  });
});



router.get('/pitanja_studenata', function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error",' +
          ' "status" : 500}');
    }

    client.query("select * from node.pitanja_studenata order by broj_glasova desc;",

        function (err, result) {
          done();
          console.info(req.body.sifra +" " + req.body.index);
          if (err) {
            console.info(err);
            res.sendStatus(400);
          } else {
            res.render('pitanja_studenata',{
              objekti: result.rows,
              sifra: req.body.sifra,
              index: req.body.index
            });
          }
        });
  });
});

router.get('/studenti', function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error",' +
          ' "status" : 500}');
    }

    client.query("select * from node.pitanja_studenata;",

        function (err, result) {
          done();

          if (err) {
            console.info(err);
            res.sendStatus(400);
          } else {
            res.render('odg_prof', {
              objekti: result.rows
            });
          }
        });
  });
});


router.post('/rezultati/:sifra/:index',
    function(req, res, next) {
      pool.connect(function (err, client, done) {
        if (err) {
          res.end('{"error" : "Error",' +
              ' "status" : 500}');
        }

        client.query("select a.pitanje, b.odgovor from node.pitanja a " +
            "inner join node.odgovori b " +
            "on b.id_pitanja = a.id_pitanja;",
            function (err, result) {
              done();
              if (err) {
                console.info(err);
                res.sendStatus(400);
              } else {
                res.render('rezultati', {
                  title: 'Rezultati',
                  objekti: result.rows,
                  sifra: req.params.sifra,
                  index: req.params.index
                });
              }
            });
      });
    });

router.post('/odg', function(req, res, next) {
  pool.connect(function (err, client, done) {
    if (err) {
      res.end('{"error" : "Error",' +
          ' "status" : 500}');
    }

    client.query("UPDATE node.pitanja_studenata SET odgovor = $1 " +
        "WHERE id_pitanja = $2;",
        [req.body.odgovor, req.body.id_pitanja],
        function (err, result) {
          done();

          if (err) {
            console.info(err);
            res.sendStatus(400);
          } else {
            res.redirect('/studenti');
          }
        });
  });
});

module.exports = router;
