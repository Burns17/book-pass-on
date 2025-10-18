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

const students: StudentRecord[] = [
  { id: '11110', firstName: 'Simone', lastName: 'Brown', email: 'SimoneBrown@school.com', password: 'Pass2025!' },
  { id: '11111', firstName: 'James', lastName: 'Brown', email: 'JamesBrown@school.com', password: 'Pass2025!' },
  { id: '11112', firstName: 'Phillip', lastName: 'Brown', email: 'PhillipBrown@school.com', password: 'Pass2025!' },
  { id: '11113', firstName: 'Chantal', lastName: 'Brown', email: 'ChantalBrown@school.com', password: 'Pass2025!' },
  { id: '11114', firstName: 'Jessica', lastName: 'Brown', email: 'JessicaBrown@school.com', password: 'Pass2025!' },
  { id: '11115', firstName: 'Ryan', lastName: 'Brown', email: 'RyanBrown@school.com', password: 'Pass2025!' },
  { id: '11116', firstName: 'Trudy', lastName: 'Brown', email: 'TrudyBrown@school.com', password: 'Pass2025!' },
  { id: '11117', firstName: 'France', lastName: 'Brown', email: 'FranceBrown@school.com', password: 'Pass2025!' },
  { id: '11118', firstName: 'Francine', lastName: 'Brown', email: 'FrancineBrown@school.com', password: 'Pass2025!' },
  { id: '11119', firstName: 'Sylvester', lastName: 'Brown', email: 'SylvesterBrown@school.com', password: 'Pass2025!' },
  { id: '11120', firstName: 'Peter', lastName: 'Brown', email: 'PeterBrown@school.com', password: 'Pass2025!' },
  { id: '11121', firstName: 'John', lastName: 'Brown', email: 'JohnBrown@school.com', password: 'Pass2025!' },
  { id: '11122', firstName: 'Justine', lastName: 'Brown', email: 'JustineBrown@school.com', password: 'Pass2025!' },
  { id: '11123', firstName: 'Jack', lastName: 'Brown', email: 'JackBrown@school.com', password: 'Pass2025!' },
  { id: '11124', firstName: 'Jess', lastName: 'Brown', email: 'JessBrown@school.com', password: 'Pass2025!' },
  { id: '11125', firstName: 'Ruth', lastName: 'Brown', email: 'RuthBrown@school.com', password: 'Pass2025!' },
  { id: '11126', firstName: 'Rebbeca', lastName: 'Brown', email: 'RebbecaBrown@school.com', password: 'Pass2025!' },
  { id: '11127', firstName: 'Fiona', lastName: 'Brown', email: 'FionaBrown@school.com', password: 'Pass2025!' },
  { id: '11128', firstName: 'Fallon', lastName: 'Brown', email: 'FallonBrown@school.com', password: 'Pass2025!' },
  { id: '11129', firstName: 'Tiffany', lastName: 'Brown', email: 'TiffanyBrown@school.com', password: 'Pass2025!' },
  { id: '11130', firstName: 'Jackson', lastName: 'Brown', email: 'JacksonBrown@school.com', password: 'Pass2025!' },
  { id: '11131', firstName: 'Robby', lastName: 'Brown', email: 'RobbyBrown@school.com', password: 'Pass2025!' },
  { id: '11132', firstName: 'Robin', lastName: 'Brown', email: 'RobinBrown@school.com', password: 'Pass2025!' },
  { id: '11133', firstName: 'Earl', lastName: 'Brown', email: 'EarlBrown@school.com', password: 'Pass2025!' },
  { id: '11134', firstName: 'Ester', lastName: 'White', email: 'EsterWhite@school.com', password: 'Pass2025!' },
  { id: '11135', firstName: 'Page', lastName: 'White', email: 'PageWhite@school.com', password: 'Pass2025!' },
  { id: '11136', firstName: 'Maggie', lastName: 'White', email: 'MaggieWhite@school.com', password: 'Pass2025!' },
  { id: '11137', firstName: 'Jonas', lastName: 'White', email: 'JonasWhite@school.com', password: 'Pass2025!' },
  { id: '11138', firstName: 'Jonathan', lastName: 'White', email: 'JonathanWhite@school.com', password: 'Pass2025!' },
  { id: '11139', firstName: 'Sally', lastName: 'White', email: 'SallyWhite@school.com', password: 'Pass2025!' },
  { id: '11140', firstName: 'Shane', lastName: 'White', email: 'ShaneWhite@school.com', password: 'Pass2025!' },
  { id: '11141', firstName: 'Shawn', lastName: 'White', email: 'ShawnWhite@school.com', password: 'Pass2025!' },
  { id: '11142', firstName: 'Mason', lastName: 'White', email: 'MasonWhite@school.com', password: 'Pass2025!' },
  { id: '11143', firstName: 'Mellisa', lastName: 'White', email: 'MellisaWhite@school.com', password: 'Pass2025!' },
  { id: '11144', firstName: 'Mike', lastName: 'White', email: 'MikeWhite@school.com', password: 'Pass2025!' },
  { id: '11145', firstName: 'Mikey', lastName: 'White', email: 'MikeyWhite@school.com', password: 'Pass2025!' },
  { id: '11146', firstName: 'Sophia', lastName: 'White', email: 'SophiaWhite@school.com', password: 'Pass2025!' },
  { id: '11147', firstName: 'Stephanie', lastName: 'White', email: 'StephanieWhite@school.com', password: 'Pass2025!' },
  { id: '11148', firstName: 'Sofie', lastName: 'White', email: 'SofieWhite@school.com', password: 'Pass2025!' },
  { id: '11149', firstName: 'Shanika', lastName: 'White', email: 'ShanikaWhite@school.com', password: 'Pass2025!' },
  { id: '11150', firstName: 'Anna-Kay', lastName: 'White', email: 'Anna-KayWhite@school.com', password: 'Pass2025!' },
  { id: '11151', firstName: 'Shanice', lastName: 'White', email: 'ShaniceWhite@school.com', password: 'Pass2025!' },
  { id: '11152', firstName: 'Dianna', lastName: 'White', email: 'DiannaWhite@school.com', password: 'Pass2025!' },
  { id: '11153', firstName: 'Rihanna', lastName: 'White', email: 'RihannaWhite@school.com', password: 'Pass2025!' },
  { id: '11154', firstName: 'Pablo', lastName: 'White', email: 'PabloWhite@school.com', password: 'Pass2025!' },
  { id: '11155', firstName: 'Eric', lastName: 'White', email: 'EricWhite@school.com', password: 'Pass2025!' },
  { id: '11156', firstName: 'Tom', lastName: 'White', email: 'TomWhite@school.com', password: 'Pass2025!' },
  { id: '11157', firstName: 'Serena', lastName: 'White', email: 'SerenaWhite@school.com', password: 'Pass2025!' },
  { id: '11158', firstName: 'Sarah', lastName: 'White', email: 'SarahWhite@school.com', password: 'Pass2025!' },
  { id: '11159', firstName: 'Mia', lastName: 'Black', email: 'MiaBlack@school.com', password: 'Pass2025!' },
  { id: '11160', firstName: 'Allan', lastName: 'Black', email: 'AllanBlack@school.com', password: 'Pass2025!' },
  { id: '11161', firstName: 'Zion', lastName: 'Black', email: 'ZionBlack@school.com', password: 'Pass2025!' },
  { id: '11162', firstName: 'Alex', lastName: 'Black', email: 'AlexBlack@school.com', password: 'Pass2025!' },
  { id: '11163', firstName: 'Athena', lastName: 'Black', email: 'AthenaBlack@school.com', password: 'Pass2025!' },
  { id: '11164', firstName: 'Nicholas', lastName: 'Black', email: 'NicholasBlack@school.com', password: 'Pass2025!' },
  { id: '11165', firstName: 'Alice', lastName: 'Black', email: 'AliceBlack@school.com', password: 'Pass2025!' },
  { id: '11166', firstName: 'Alicia', lastName: 'Black', email: 'AliciaBlack@school.com', password: 'Pass2025!' },
  { id: '11167', firstName: 'Vanessa', lastName: 'Black', email: 'VanessaBlack@school.com', password: 'Pass2025!' },
  { id: '11168', firstName: 'Jordan', lastName: 'Black', email: 'JordanBlack@school.com', password: 'Pass2025!' },
  { id: '11169', firstName: 'Tyreese', lastName: 'Black', email: 'TyreeseBlack@school.com', password: 'Pass2025!' },
  { id: '11170', firstName: 'Lexie', lastName: 'Black', email: 'LexieBlack@school.com', password: 'Pass2025!' },
  { id: '11171', firstName: 'Lewis', lastName: 'Black', email: 'LewisBlack@school.com', password: 'Pass2025!' },
  { id: '11172', firstName: 'Alexia', lastName: 'Black', email: 'AlexiaBlack@school.com', password: 'Pass2025!' },
  { id: '11173', firstName: 'Louis', lastName: 'Black', email: 'LouisBlack@school.com', password: 'Pass2025!' },
  { id: '11174', firstName: 'Louie', lastName: 'Black', email: 'LouieBlack@school.com', password: 'Pass2025!' },
  { id: '11175', firstName: 'Anna-Nichole', lastName: 'Black', email: 'Anna-NicholeBlack@school.com', password: 'Pass2025!' },
  { id: '11176', firstName: 'Anna-Beth', lastName: 'Black', email: 'Anna-BethBlack@school.com', password: 'Pass2025!' },
  { id: '11177', firstName: 'Hayden', lastName: 'Black', email: 'HaydenBlack@school.com', password: 'Pass2025!' },
  { id: '11178', firstName: 'Amarice', lastName: 'Black', email: 'AmariceBlack@school.com', password: 'Pass2025!' },
  { id: '11179', firstName: 'Josephine', lastName: 'Jones', email: 'JosephineJones@school.com', password: 'Pass2025!' },
  { id: '11180', firstName: 'Donnette', lastName: 'Jones', email: 'DonnetteJones@school.com', password: 'Pass2025!' },
  { id: '11181', firstName: 'Conner', lastName: 'Jones', email: 'ConnerJones@school.com', password: 'Pass2025!' },
  { id: '11182', firstName: 'Ojani', lastName: 'Jones', email: 'OjaniJones@school.com', password: 'Pass2025!' },
  { id: '11183', firstName: 'Conrad', lastName: 'Jones', email: 'ConradJones@school.com', password: 'Pass2025!' },
  { id: '11184', firstName: 'Sam', lastName: 'Jones', email: 'SamJones@school.com', password: 'Pass2025!' },
  { id: '11185', firstName: 'Wade', lastName: 'Jones', email: 'WadeJones@school.com', password: 'Pass2025!' },
  { id: '11186', firstName: 'Shamoy', lastName: 'Jones', email: 'ShamoyJones@school.com', password: 'Pass2025!' },
  { id: '11187', firstName: 'Shamoya', lastName: 'Jones', email: 'ShamoyaJones@school.com', password: 'Pass2025!' },
  { id: '11188', firstName: 'Rosetta', lastName: 'Jones', email: 'RosettaJones@school.com', password: 'Pass2025!' },
  { id: '11189', firstName: 'Clarke', lastName: 'Jones', email: 'ClarkeJones@school.com', password: 'Pass2025!' },
  { id: '11190', firstName: 'Elizabeth', lastName: 'Jones', email: 'ElizabethJones@school.com', password: 'Pass2025!' },
  { id: '11191', firstName: 'Aleshia', lastName: 'Jones', email: 'AleshiaJones@school.com', password: 'Pass2025!' },
  { id: '11192', firstName: 'Shaula', lastName: 'Jones', email: 'ShaulaJones@school.com', password: 'Pass2025!' },
  { id: '11193', firstName: 'Shantoya', lastName: 'Jones', email: 'ShantoyaJones@school.com', password: 'Pass2025!' },
  { id: '11194', firstName: 'Deshawn', lastName: 'Jones', email: 'DeshawnJones@school.com', password: 'Pass2025!' },
  { id: '11195', firstName: 'Tesann', lastName: 'Jones', email: 'TesannJones@school.com', password: 'Pass2025!' },
  { id: '11196', firstName: 'Tonice', lastName: 'Jones', email: 'ToniceJones@school.com', password: 'Pass2025!' },
  { id: '11197', firstName: 'Tony', lastName: 'Jones', email: 'TonyJones@school.com', password: 'Pass2025!' },
  { id: '11198', firstName: 'Monique', lastName: 'Chambers', email: 'MoniqueChambers@school.com', password: 'Pass2025!' },
  { id: '11199', firstName: 'Monica', lastName: 'Chambers', email: 'MonicaChambers@school.com', password: 'Pass2025!' },
  { id: '11200', firstName: 'Taylor', lastName: 'Chambers', email: 'TaylorChambers@school.com', password: 'Pass2025!' },
  { id: '11201', firstName: 'Jade', lastName: 'Chambers', email: 'JadeChambers@school.com', password: 'Pass2025!' },
  { id: '11202', firstName: 'Diamond', lastName: 'Chambers', email: 'DiamondChambers@school.com', password: 'Pass2025!' },
  { id: '11203', firstName: 'Amber', lastName: 'Chambers', email: 'AmberChambers@school.com', password: 'Pass2025!' },
  { id: '11204', firstName: 'Emerald', lastName: 'Chambers', email: 'EmeraldChambers@school.com', password: 'Pass2025!' },
  { id: '11205', firstName: 'Ruby', lastName: 'Chambers', email: 'RubyChambers@school.com', password: 'Pass2025!' },
  { id: '11206', firstName: 'Pearl', lastName: 'Chambers', email: 'PearlChambers@school.com', password: 'Pass2025!' },
  { id: '11207', firstName: 'Destiny', lastName: 'Chambers', email: 'DestinyChambers@school.com', password: 'Pass2025!' },
  { id: '11208', firstName: 'Treasure', lastName: 'Chambers', email: 'TreasureChambers@school.com', password: 'Pass2025!' },
];

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

    // **SECURITY**: Verify that the requesting user is authenticated and has admin role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.log('Unauthorized seed attempt - no auth header');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Authentication required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    
    if (authError || !user) {
      console.log('Unauthorized seed attempt - invalid token');
      return new Response(
        JSON.stringify({ error: 'Unauthorized - Invalid authentication' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user has admin role
    const { data: userRole, error: roleError } = await supabaseAdmin
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .single();

    if (roleError || !userRole) {
      console.log(`Forbidden seed attempt by non-admin user: ${user.email}`);
      return new Response(
        JSON.stringify({ error: 'Forbidden - Admin access required to seed data' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Admin user ${user.email} is seeding student data...`);

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
