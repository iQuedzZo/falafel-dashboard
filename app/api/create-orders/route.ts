import { NextResponse } from "next/server";
import { serverSupabase } from "@/lib/serverSupabase";


export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    },
  });
}


export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log(
      "FULL BODY:",
      JSON.stringify(body, null, 2)
    );


    let args: any;


    if (body.message?.toolCalls?.[0]) {
      const toolCall = body.message.toolCalls[0];

      args =
        toolCall.function?.arguments ||
        toolCall.arguments;
    }

    else if (body.message?.toolCallList?.[0]) {
      const toolCall = body.message.toolCallList[0];

      args =
        toolCall.function?.arguments ||
        toolCall.arguments;
    }

    else {
      args = body;
    }


    if (typeof args === "string") {
      args = JSON.parse(args);
    }


    console.log("ORDER DATA:", args);


    if (
      !args?.customer_name ||
      !args?.phone ||
      !args?.items
    ) {
      return NextResponse.json(
        {
          result: "failed",
          message: "Missing order information"
        },
        {
          status: 400,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }


    const { data, error } = await serverSupabase
      .from("orders")
      .insert([
        {
          customer_name: args.customer_name,
          phone: args.phone,
          items: args.items,
          status: "New",
          order_time: new Date().toISOString(),
        },
      ])
      .select()
      .single();


    if (error) {
      console.log("SUPABASE ERROR:", error);

      return NextResponse.json(
        {
          result: "failed",
          message: error.message
        },
        {
          status: 500,
          headers: {
            "Access-Control-Allow-Origin": "*",
          },
        }
      );
    }


    console.log("ORDER SAVED:", data);


    return NextResponse.json(
      {
        result: "success",
        message: "Order placed successfully",
        order_id: data.id
      },
      {
        status: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
        },
      }
    );


  } catch(error:any) {

    console.log("API ERROR:", error);

    return NextResponse.json(
      {
        result:"failed",
        message:error.message
      },
      {
        status:500,
        headers:{
          "Access-Control-Allow-Origin":"*",
        },
      }
    );
  }
}