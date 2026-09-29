# R002d · Messaging API

**Owner:** leaf-route worker. **Dependencies:** R002. **Status:** done.

**Interface:** mail, announcement, comment, and invitation request contracts
with shared response/error handling; route ownership and UI remain R005.

**Work:** migrate message-related API calls and DTO conversion without
conflating separate permission or read-state semantics.

**Deletion:** old message/invitation API/type modules and casing maps after the
consumers move.

**Tests/evidence:** unread/read, list/pagination, create/update, invitation
accept/reject, failure metadata and converter tests; route/API dependency scan.

Final evidence: [implementation results](../review/implementation-results.md).
