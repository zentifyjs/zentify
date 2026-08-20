import { describe, expect, it } from "vitest";
import { Body } from "../../src/decorators/body";
import { Query } from "../../src/decorators/query";
import { getParameterMetadata } from "../../src/decorators/metadata";
import { Dependency } from "../../src/decorators/dependency";

class CreateUserDto {
  static schema = {};
}

describe("Body decorator", () => {
  it("records a body parameter with its DTO class", () => {
    class C {
      create(@Body() dto: CreateUserDto) {}
    }

    const meta = getParameterMetadata(C.prototype, "create");
    expect(meta).toEqual([
      {
        index: 0,
        type: "body",
        kind: { type: "internal" },
        additionalData: { dtoClass: CreateUserDto },
      },
    ]);
  });

  it("sets dtoClass to null when the type is not a DTO", () => {
    class C {
      create(@Body() data: string) {}
    }

    const meta = getParameterMetadata(C.prototype, "create");
    expect(meta[0].additionalData?.dtoClass).toBeNull();
  });
});

describe("Query decorator", () => {
  it("records a query parameter with its DTO class", () => {
    class C {
      list(@Query() dto: CreateUserDto) {}
    }

    const meta = getParameterMetadata(C.prototype, "list");
    expect(meta).toEqual([
      {
        index: 0,
        type: "query",
        kind: { type: "internal" },
        additionalData: { dtoClass: CreateUserDto },
      },
    ]);
  });

  it("sets dtoClass to null when the type is not a DTO", () => {
    class C {
      list(@Query() data: string) {}
    }

    const meta = getParameterMetadata(C.prototype, "list");
    expect(meta[0].additionalData?.dtoClass).toBeNull();
  });

  it("works alongside other decorators preserving indexes", () => {
    class C {
      find(@Query() dto: CreateUserDto, @Body() body: CreateUserDto) {}
    }

    const meta = getParameterMetadata(C.prototype, "find");
    expect(meta).toEqual(
      expect.arrayContaining([
        {
          index: 0,
          type: "query",
          kind: { type: "internal" },
          additionalData: { dtoClass: CreateUserDto },
        },
        {
          index: 1,
          type: "body",
          kind: { type: "internal" },
          additionalData: { dtoClass: CreateUserDto },
        },
      ]),
    );
  });
});