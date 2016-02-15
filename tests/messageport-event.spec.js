/**
 * Created by Oleg Galaburda on 15.02.16.
 */
describe('MessagePortEvent', function() {
  describe('Instance', function() {
    var event = null;
    var mpEvent = null;
    beforeEach(function() {
      event = {type: 'any-event', data: null};
      mpEvent = new MessagePortEvent(event, 'qwerty123456');
    });
    it('should store event link', function() {
      expect(mpEvent.event).to.be.equal(event);
    });
    it('should store dispatcher Id', function() {
      expect(mpEvent.dispatcherId).to.be.equal('qwerty123456');
    });
    describe('toJSON()', function() {
      it('should return raw object representation', function() {
        var obj = mpEvent.toJSON();
        expect(JSON.parse(obj.event)).to.be.eql(event);
        expect(obj.dispatcherId).to.be.equal('qwerty123456');
      });
    });
    describe('When event has toJSON', function() {
      var toJSON = null;
      var obj = null;
      beforeEach(function() {
        toJSON = sinon.spy(function() {
          return {result: true};
        });
        event.toJSON = toJSON;
        obj = mpEvent.toJSON();
      });
      it('should call toJSON() on event', function() {
        expect(toJSON).to.be.calledOnce;
      });
      it('should store result', function() {
        expect(obj.event).to.be.eql({result: true});
      });
    });
  });
  describe('fromJSON()', function() {
    it('should accept JSON string as parameter', function() {
      var jsonString = JSON.stringify({
        event: {type: 'my-event'},
        dispatcherId: 'asdfgh'
      });
      expect(MessagePortEvent.fromJSON(jsonString)).to.be.eql({
        event: {type: 'my-event'},
        dispatcherId: 'asdfgh'
      });
    });
    it('should accept event being JSON string', function() {
      var jsonString = {
        event: JSON.stringify({type: 'my-event'}),
        dispatcherId: 'password'
      };
      expect(MessagePortEvent.fromJSON(jsonString)).to.be.eql({
        event: {type: 'my-event'},
        dispatcherId: 'password'
      });
    });
    it('should accept object as parameter', function() {
      expect(MessagePortEvent.fromJSON({
        event: {type: 'my-event'},
        dispatcherId: '111111'
      })).to.be.eql({
          event: {type: 'my-event'},
          dispatcherId: '111111'
        });
    });
    it('should return null if no \'event\' field', function() {
      expect(MessagePortEvent.fromJSON({dispatcherId: '123456789'})).to.be.null;
    });
  });
  describe('isEvent()', function() {
    it('should return false if no event field', function() {
      expect(MessagePortEvent.isEvent({dispatcherId: '123456'})).to.be.false;
    });
    it('should return false if no dispatcherId field', function() {
      expect(MessagePortEvent.isEvent({event: {}})).to.be.false;
    });
    it('should return true if event and dispatcherId fields present', function() {
      expect(MessagePortEvent.isEvent({event: {}, dispatcherId: 'letmein'})).to.be.true;
    });

  });
});
