import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.75.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface StudentRecord {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

// CSV data embedded directly in the function
const csvData = `STUDENT ID NUM,FIRST NAME,LAST NAME,STUDENT EMAIL ADDRESS
11110,Simone,Brown,SimoneBrown@school.com
11111,James,Brown,JamesBrown@school.com
11112,Phillip,Brown,PhillipBrown@school.com
11113,Chantal,Brown,ChantalBrown@school.com
11114,Jessica,Brown,JessicaBrown@school.com
11115,Ryan,Brown,RyanBrown@school.com
11116,Trudy,Brown,TrudyBrown@school.com
11117,France,Brown,FranceBrown@school.com
11118,Francine,Brown,FrancineBrown@school.com
11119,Sylvester,Brown,SylvesterBrown@school.com
11120,Peter,Brown,PeterBrown@school.com
11121,John,Brown,JohnBrown@school.com
11122,Justine,Brown,JustineBrown@school.com
11123,Jack,Brown,JackBrown@school.com
11124,Jess,Brown,JessBrown@school.com
11125,Ruth,Brown,RuthBrown@school.com
11126,Rebbeca,Brown,RebbecaBrown@school.com
11127,Fiona,Brown,FionaBrown@school.com
11128,Fallon,Brown,FallonBrown@school.com
11129,Tiffany,Brown,TiffanyBrown@school.com
11130,Jackson,Brown,JacksonBrown@school.com
11131,Robby,Brown,RobbyBrown@school.com
11132,Robin,Brown,RobinBrown@school.com
11133,Earl,Brown,EarlBrown@school.com
11134,Ester,White,EsterWhite@school.com
11135,Page,White,PageWhite@school.com
11136,Maggie,White,MaggieWhite@school.com
11137,Jonas,White,JonasWhite@school.com
11138,Jonathan,White,JonathanWhite@school.com
11139,Sally,White,SallyWhite@school.com
11140,Shane,White,ShaneWhite@school.com
11141,Shawn,White,ShawnWhite@school.com
11142,Mason,White,MasonWhite@school.com
11143,Mellisa,White,MellisaWhite@school.com
11144,Mike,White,MikeWhite@school.com
11145,Mikey,White,MikeyWhite@school.com
11146,Sophia,White,SophiaWhite@school.com
11147,Stephanie,White,StephanieWhite@school.com
11148,Sofie,White,SofieWhite@school.com
11149,Shanika,White,ShanikaWhite@school.com
11150,Anna-Kay,White,Anna-KayWhite@school.com
11151,Shanice,White,ShaniceWhite@school.com
11152,Dianna,White,DiannaWhite@school.com
11153,Rihanna,White,RihannaWhite@school.com
11154,Pablo,White,PabloWhite@school.com
11155,Eric,White,EricWhite@school.com
11156,Tom,White,TomWhite@school.com
11157,Serena,White,SerenaWhite@school.com
11158,Sarah,White,SarahWhite@school.com
11159,Mia,Black,MiaBlack@school.com
11160,Allan,Black,AllanBlack@school.com
11161,Zion,Black,ZionBlack@school.com
11162,Alex,Black,AlexBlack@school.com
11163,Athena,Black,AthenaBlack@school.com
11164,Nicholas,Black,NicholasBlack@school.com
11165,Alice,Black,AliceBlack@school.com
11166,Alicia,Black,AliciaBlack@school.com
11167,Vanessa,Black,VanessaBlack@school.com
11168,Jordan,Black,JordanBlack@school.com
11169,Tyreese,Black,TyreeseBlack@school.com
11170,Lexie,Black,LexieBlack@school.com
11171,Lewis,Black,LewisBlack@school.com
11172,Alexia,Black,AlexiaBlack@school.com
11173,Louis,Black,LouisBlack@school.com
11174,Louie,Black,LouieBlack@school.com
11175,Anna-Nichole,Black,Anna-NicholeBlack@school.com
11176,Anna-Beth,Black,Anna-BethBlack@school.com
11177,Hayden,Black,HaydenBlack@school.com
11178,Amarice,Black,AmariceBlack@school.com
11179,Josephine,Jones,JosephineJones@school.com
11180,Donnette,Jones,DonnetteJones@school.com
11181,Conner,Jones,ConnerJones@school.com
11182,Ojani,Jones,OjaniJones@school.com
11183,Conrad,Jones,ConradJones@school.com
11184,Sam,Jones,SamJones@school.com
11185,Wade,Jones,WadeJones@school.com
11186,Shamoy,Jones,ShamoyJones@school.com
11187,Shamoya,Jones,ShamoyaJones@school.com
11188,Rosetta,Jones,RosettaJones@school.com
11189,Clarke,Jones,ClarkeJones@school.com
11190,Elizabeth,Jones,ElizabethJones@school.com
11191,Aleshia,Jones,AleshiaJones@school.com
11192,Shaula,Jones,ShaulaJones@school.com
11193,Shantoya,Jones,ShantoyaJones@school.com
11194,Deshawn,Jones,DeshawnJones@school.com
11195,Tesann,Jones,TesannJones@school.com
11196,Tonice,Jones,ToniceJones@school.com
11197,Tony,Jones,TonyJones@school.com
11198,Monique,Chambers,MoniqueChambers@school.com
11199,Monica,Chambers,MonicaChambers@school.com
11200,Taylor,Chambers,TaylorChambers@school.com
11201,Jade,Chambers,JadeChambers@school.com
11202,Diamond,Chambers,DiamondChambers@school.com
11203,Amber,Chambers,AmberChambers@school.com
11204,Emerald,Chambers,EmeraldChambers@school.com
11205,Ruby,Chambers,RubyChambers@school.com
11206,Pearl,Chambers,PearlChambers@school.com
11207,Destiny,Chambers,DestinyChambers@school.com
11208,Treasure,Chambers,TreasureChambers@school.com`;

// Parse CSV data
function parseCSV(csv: string): StudentRecord[] {
  const lines = csv.trim().split('\n');
  const students: StudentRecord[] = [];
  
  // Skip header line
  for (let i = 1; i < lines.length; i++) {
    const [id, firstName, lastName, email] = lines[i].split(',');
    students.push({
      id: id.trim(),
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      password: '1' + id.trim(), // Add "1" in front of student ID for password
    });
  }
  
  return students;
}

const students = parseCSV(csvData);

const sampleTextbooks = [
  { title: 'Biology: The Dynamics of Life', author: 'Glencoe McGraw-Hill', isbn: '9780078299001', edition: '2004', condition: 'good' },
  { title: 'Chemistry: Matter and Change', author: 'Glencoe Science', isbn: '9780078746376', edition: '2008', condition: 'excellent' },
  { title: 'Algebra 1', author: 'McDougal Littell', isbn: '9780618594023', edition: '2007', condition: 'fair' },
  { title: 'Geometry', author: 'Holt McDougal', isbn: '9780547647142', edition: '2012', condition: 'good' },
  { title: 'World History: Patterns of Interaction', author: 'McDougal Littell', isbn: '9780547491127', edition: '2012', condition: 'excellent' },
  { title: 'The American Pageant', author: 'David M. Kennedy', isbn: '9781133959724', edition: '15th', condition: 'good' },
  { title: 'Physics: Principles and Problems', author: 'Glencoe Science', isbn: '9780078458132', edition: '2009', condition: 'fair' },
  { title: 'Calculus: Graphical, Numerical, Algebraic', author: 'Finney', isbn: '9780132014083', edition: '4th', condition: 'excellent' },
  { title: 'Environmental Science', author: 'Holt, Rinehart & Winston', isbn: '9780030781360', edition: '2006', condition: 'good' },
  { title: 'English Literature and Composition', author: 'Bedford', isbn: '9781457650604', edition: '10th', condition: 'good' },
];

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });


    // Get school_id for school.com
    const { data: school } = await supabaseAdmin
      .from('schools')
      .select('id')
      .eq('domain', 'school.com')
      .single();

    if (!school) {
      throw new Error('School not found');
    }

    const createdUsers = [];

    // Create users
    for (const student of students) {
      try {
        const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
          email: student.email,
          password: student.password,
          email_confirm: true,
          user_metadata: {
            first_name: student.firstName,
            last_name: student.lastName,
          },
        });

        if (authError) {
          console.error(`Error creating user ${student.email}:`, authError);
          continue;
        }

        createdUsers.push({
          userId: authData.user.id,
          email: student.email,
          firstName: student.firstName,
          lastName: student.lastName,
        });
      } catch (error) {
        console.error(`Failed to create user ${student.email}:`, error);
      }
    }

    // Add textbooks for every 3rd user
    const textbooksToInsert = [];
    for (let i = 0; i < createdUsers.length; i += 3) {
      const user = createdUsers[i];
      const bookIndex = i % sampleTextbooks.length;
      const book = sampleTextbooks[bookIndex];
      
      textbooksToInsert.push({
        owner_id: user.userId,
        school_id: school.id,
        title: book.title,
        author: book.author,
        isbn: book.isbn,
        edition: book.edition,
        condition: book.condition,
        status: 'available',
      });
    }

    if (textbooksToInsert.length > 0) {
      const { error: textbooksError } = await supabaseAdmin
        .from('textbooks')
        .insert(textbooksToInsert);

      if (textbooksError) {
        console.error('Error inserting textbooks:', textbooksError);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${createdUsers.length} users and ${textbooksToInsert.length} textbooks`,
        usersCreated: createdUsers.length,
        textbooksCreated: textbooksToInsert.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
