import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log(
      "FULL BODY:",
      JSON.stringify(body, null, 2)
    );


    let args;


    // Vapi format
    if (body.message?.toolCalls?.[0]) {

      const toolCall =
        body.message.toolCalls[0];

      args =
        toolCall.function?.arguments ||
        toolCall.arguments;

    }


    // Older Vapi format
    else if (body.message?.toolCallList?.[0]) {

      const toolCall =
        body.message.toolCallList[0];

      args =
        toolCall.function?.arguments ||
        toolCall.arguments;

    }


    // Normal POST request (curl / website)
    else {

      args = body;

    }



    console.log(
      "ORDER DATA:",
      args
    );



    if (
      !args?.customer_name ||
      !args?.phone ||
      !args?.items
    ) {

      return NextResponse.json(
        {
          success: false,
          error: "Missing order information",
          received: args
        },
        {
          status: 400
        }
      );

    }




    const { data, error } = await supabase
      .from("orders")
      .insert([
        {
          customer_name: args.customer_name,
          phone: args.phone,
          items: args.items,
          status: "New",
          order_time: new Date().toISOString()
        }
      ])
      .select();



    if (error) {

      console.log(
        "SUPABASE ERROR:",
        error
      );


      return NextResponse.json(
        {
          success:false,
          error:error.message
        },
        {
          status:500
        }
      );

    }




    console.log(
      "ORDER SAVED:",
      data
    );



    return NextResponse.json(
      {
        success:true,
        order:data[0]
      }
    );



  } catch(error:any) {


    console.log(
      "API ERROR:",
      error
    );


    return NextResponse.json(
      {
        success:false,
        error:error.message
      },
      {
        status:500
      }
    );


  }
}