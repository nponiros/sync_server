'use strict';

const chakram = require('chakram');
const expect = chakram.expect;

const ChangesTable = require('../../../lib/db_connectors/NeDB/changes_table');

describe('changesTable', () => {
  it('should be able to cope with mods including dots when adding a change', (done) => {
    const changesTable = new ChangesTable('changes', { inMemoryOnly: true });
    changesTable
      .add({ mods: { 'foo.bar': 'foo', 'bar': 'baz', 'feb.bar': 'fe' } })
      .then(() => {
        changesTable.store.find({}, (err, docs) => {
          if (err) {
            return done(err);
          }
          expect(docs[0].mods).to.deep.equal({
            [`foo${changesTable.dotReplacer}bar`]: 'foo',
            bar: 'baz',
            [`feb${changesTable.dotReplacer}bar`]: 'fe',
          });
          done();
        });
      })
      .catch((e) => {
        done(e);
      });
  });

  it('should replace the dotReplacement with a real dot when changes are read getByRevision()', (done) => {
    const changesTable = new ChangesTable('changes', { inMemoryOnly: true });
    const changeObject = {
      mods: {
        [`foo${changesTable.dotReplacer}bar`]: 'foo',
        bar: 'baz',
        [`feb${changesTable.dotReplacer}bar`]: 'fe',
      },
      rev: 1,
    };
    changesTable.store.insert(changeObject, (err) => {
      if (err) {
        return done(err);
      }
      changesTable.getByRevision(0)
        .then((data) => {
          expect(data[0].mods).to.deep.equal({
            'foo.bar': 'foo',
            bar: 'baz',
            'feb.bar': 'fe',
          });
          done();
        })
        .catch((err) => {
          done(err);
        });
    });
  });

  it('should replace the dotReplacement with a real dot when changes are read getByRevisionAndClientID()', (done) => {
    const changesTable = new ChangesTable('changes', { inMemoryOnly: true });
    const changeObject = {
      mods: {
        [`foo${changesTable.dotReplacer}bar`]: 'foo',
        bar: 'baz',
        [`feb${changesTable.dotReplacer}bar`]: 'fe' },
      rev: 1,
      source: 0,
    };
    changesTable.store.insert(changeObject, (err) => {
      if (err) {
        return done(err);
      }
      changesTable.getByRevisionAndClientID(0, 1)
          .then((data) => {
            expect(data[0].mods).to.deep.equal({
              'foo.bar': 'foo',
              bar: 'baz',
              'feb.bar': 'fe',
            });
            done();
          })
          .catch((err) => {
            done(err);
          });
    });
  });
});
